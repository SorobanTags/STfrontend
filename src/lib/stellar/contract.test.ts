import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const {
  getAccount,
  simulateTransaction,
  sendTransaction,
  getTransaction,
  assembleTransaction,
  contractCall,
  signTx,
} = vi.hoisted(() => ({
  getAccount: vi.fn(),
  simulateTransaction: vi.fn(),
  sendTransaction: vi.fn(),
  getTransaction: vi.fn(),
  assembleTransaction: vi.fn(),
  contractCall: vi.fn(),
  signTx: vi.fn(),
}));

vi.mock('./freighter', () => ({ signTx }));

vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar/stellar-sdk')>();
  class MockServer {
    getAccount = getAccount;
    simulateTransaction = simulateTransaction;
    sendTransaction = sendTransaction;
    getTransaction = getTransaction;
  }
  class MockContract {
    constructor(readonly contractId: string) {}
    call(method: string, ...args: unknown[]) {
      contractCall(method, ...args);
      return { method, args };
    }
  }
  class MockTransactionBuilder {
    private operation: unknown;
    constructor(readonly account: unknown, readonly options: unknown) {}
    addOperation(operation: unknown) {
      this.operation = operation;
      return this;
    }
    setTimeout() {
      return this;
    }
    build() {
      return { operation: this.operation };
    }
  }
  class MockTransaction {
    constructor(readonly envelope: string, readonly passphrase: string) {}
  }
  class MockAddress {
    constructor(readonly address: string) {}
    toScVal() {
      return { type: 'address', value: this.address };
    }
  }
  return {
    ...actual,
    Contract: MockContract,
    TransactionBuilder: MockTransactionBuilder,
    Transaction: MockTransaction,
    Address: MockAddress,
    nativeToScVal: (value: unknown, opts?: { type?: string }) => ({ type: opts?.type, value }),
    SorobanRpc: { ...actual.SorobanRpc, Server: MockServer, assembleTransaction },
  };
});

import { enrollInCourse, registerCourseOnChain } from './contract';

const VALID_TOKEN = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

describe('contract address validation', () => {
  beforeEach(() => {
    getAccount.mockReset();
    signTx.mockReset();
  });

  it.each(['', 'not-an-address', 'GABC', VALID_TOKEN])(
    'enrollInCourse rejects invalid callerAddress %j without RPC or signing',
    async (callerAddress) => {
      await expect(enrollInCourse({ callerAddress, courseId: 'course-1' })).rejects.toThrow(
        'Invalid Stellar address for callerAddress',
      );
      expect(getAccount).not.toHaveBeenCalled();
      expect(signTx).not.toHaveBeenCalled();
    },
  );

  it('registerCourseOnChain rejects invalid callerAddress without RPC or signing', async () => {
    await expect(
      registerCourseOnChain({
        callerAddress: 'bad',
        courseId: 'course-1',
        price: 100n,
        tokenAddress: VALID_TOKEN,
      }),
    ).rejects.toThrow('Invalid Stellar address for callerAddress');
    expect(getAccount).not.toHaveBeenCalled();
    expect(signTx).not.toHaveBeenCalled();
  });

  it('registerCourseOnChain rejects invalid tokenAddress without RPC or signing', async () => {
    const { Keypair } = await import('@stellar/stellar-sdk');
    await expect(
      registerCourseOnChain({
        callerAddress: Keypair.random().publicKey(),
        courseId: 'course-1',
        price: 100n,
        tokenAddress: 'not-a-token',
      }),
    ).rejects.toThrow('Invalid Stellar address for tokenAddress');
    expect(getAccount).not.toHaveBeenCalled();
    expect(signTx).not.toHaveBeenCalled();
  });
});

describe('contract invocation', () => {
  const TX_HASH = 'abc123';
  let caller: string;
  let contract: typeof import('./contract');

  beforeEach(async () => {
    vi.useFakeTimers();
    for (const fn of [
      getAccount,
      simulateTransaction,
      sendTransaction,
      getTransaction,
      assembleTransaction,
      contractCall,
      signTx,
    ]) {
      fn.mockReset();
    }

    const { Keypair } = await import('@stellar/stellar-sdk');
    caller = Keypair.random().publicKey();

    getAccount.mockResolvedValue({ accountId: caller });
    simulateTransaction.mockResolvedValue({ results: [] });
    assembleTransaction.mockReturnValue({ build: () => ({ toXDR: () => 'assembled-xdr' }) });
    signTx.mockResolvedValue('signed-xdr');
    sendTransaction.mockResolvedValue({ status: 'PENDING', hash: TX_HASH });
    getTransaction.mockResolvedValue({ status: 'SUCCESS' });

    // `_rpc` is memoised at module scope, so load a fresh copy of the module per test.
    vi.resetModules();
    contract = await import('./contract');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Drives the `waitForTx` polling loop (20 × 2000 ms) to completion with fake timers. */
  async function settle<T>(promise: Promise<T>): Promise<T> {
    const outcome = promise.then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    await vi.waitFor(() => {
      expect(sendTransaction.mock.calls.length + simulateTransaction.mock.calls.length).toBeGreaterThan(0);
    });
    await vi.advanceTimersByTimeAsync(20 * 2000);
    const result = await outcome;
    if (result.ok) return result.value;
    throw result.error;
  }

  it('enrollInCourse builds an enroll call with the caller Address and a string courseId', async () => {
    await expect(
      settle(contract.enrollInCourse({ callerAddress: caller, courseId: 'course-1' })),
    ).resolves.toBe(TX_HASH);

    expect(contractCall).toHaveBeenCalledTimes(1);
    expect(contractCall).toHaveBeenCalledWith(
      'enroll',
      { type: 'address', value: caller },
      { type: 'string', value: 'course-1' },
    );
    expect(signTx).toHaveBeenCalledWith('assembled-xdr', expect.any(String));
  });

  it('registerCourseOnChain encodes price as i128 and defaults platformFeePct to 0', async () => {
    await expect(
      settle(
        contract.registerCourseOnChain({
          callerAddress: caller,
          courseId: 'course-1',
          price: 1_000_000n,
          tokenAddress: VALID_TOKEN,
        }),
      ),
    ).resolves.toBe(TX_HASH);

    expect(contractCall).toHaveBeenCalledWith(
      'register_course',
      { type: 'address', value: caller },
      { type: 'string', value: 'course-1' },
      { type: 'i128', value: 1_000_000n },
      { type: 'address', value: VALID_TOKEN },
      { type: 'u32', value: 0 },
    );
  });

  it('rejects with a Simulation: message and never requests a signature when simulation fails', async () => {
    simulateTransaction.mockResolvedValue({ error: 'contract panicked' });

    await expect(
      settle(contract.enrollInCourse({ callerAddress: caller, courseId: 'course-1' })),
    ).rejects.toThrow(/^Simulation: contract panicked$/);

    expect(signTx).not.toHaveBeenCalled();
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  it('rejects with Submission failed when sendTransaction returns ERROR', async () => {
    sendTransaction.mockResolvedValue({ status: 'ERROR', hash: TX_HASH });

    await expect(
      settle(contract.enrollInCourse({ callerAddress: caller, courseId: 'course-1' })),
    ).rejects.toThrow('Submission failed');

    expect(getTransaction).not.toHaveBeenCalled();
  });

  it('rejects with Transaction not confirmed when the transaction is still pending after polling', async () => {
    getTransaction.mockResolvedValue({ status: 'NOT_FOUND' });

    const error = await settle(
      contract.enrollInCourse({ callerAddress: caller, courseId: 'course-1' }),
    ).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(contract.TransactionPendingError);
    expect((error as Error).message).toBe('Transaction not confirmed');
    expect((error as InstanceType<typeof contract.TransactionPendingError>).hash).toBe(TX_HASH);
    expect(getTransaction).toHaveBeenCalledTimes(20);
  });

  it('enrollInCourse rejects a malformed caller address before any RPC request', async () => {
    await expect(
      contract.enrollInCourse({ callerAddress: 'G-not-valid', courseId: 'course-1' }),
    ).rejects.toThrow('Invalid Stellar address for callerAddress');

    expect(getAccount).not.toHaveBeenCalled();
    expect(signTx).not.toHaveBeenCalled();
  });
});
