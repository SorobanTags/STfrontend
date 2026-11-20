import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionBuilder, Networks } from '@stellar/stellar-sdk';

const ADDRESS = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

const freighter = vi.hoisted(() => ({
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  getPublicKey: vi.fn(),
  getNetwork: vi.fn(),
  signTransaction: vi.fn(),
}));

vi.mock('@stellar/freighter-api', () => freighter);

import {
  isFreighterInstalled,
  connectFreighter,
  getWalletNetwork,
  signTx,
  signNonce,
} from './freighter';

describe('freighter wallet helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    freighter.getPublicKey.mockResolvedValue(ADDRESS);
    freighter.signTransaction.mockImplementation(async (xdr: string) => xdr);
  });

  it('isFreighterInstalled resolves true when isConnected resolves', async () => {
    freighter.isConnected.mockResolvedValue(true);
    await expect(isFreighterInstalled()).resolves.toBe(true);
  });

  it('isFreighterInstalled resolves false when isConnected rejects', async () => {
    freighter.isConnected.mockRejectedValue(new Error('no extension'));
    await expect(isFreighterInstalled()).resolves.toBe(false);
  });

  it('connectFreighter requests access before reading the public key', async () => {
    const order: string[] = [];
    freighter.requestAccess.mockImplementation(async () => { order.push('requestAccess'); });
    freighter.getPublicKey.mockImplementation(async () => { order.push('getPublicKey'); return ADDRESS; });

    await expect(connectFreighter()).resolves.toBe(ADDRESS);
    expect(order).toEqual(['requestAccess', 'getPublicKey']);
  });

  it('connectFreighter propagates a declined access request', async () => {
    freighter.requestAccess.mockRejectedValue(new Error('User declined'));
    await expect(connectFreighter()).rejects.toThrow('User declined');
    expect(freighter.getPublicKey).not.toHaveBeenCalled();
  });

  it('getWalletNetwork returns the network reported by Freighter', async () => {
    freighter.getNetwork.mockResolvedValue('TESTNET');
    await expect(getWalletNetwork()).resolves.toBe('TESTNET');
  });

  it('signTx forwards the XDR and networkPassphrase to signTransaction', async () => {
    freighter.signTransaction.mockResolvedValue('signed-xdr');
    await expect(signTx('raw-xdr', Networks.TESTNET)).resolves.toBe('signed-xdr');
    expect(freighter.signTransaction).toHaveBeenCalledWith('raw-xdr', {
      networkPassphrase: Networks.TESTNET,
    });
  });

  it('signNonce signs a single manageData operation named sorobanlard_nonce', async () => {
    await signNonce('abc123', Networks.TESTNET);

    expect(freighter.signTransaction).toHaveBeenCalledTimes(1);
    const [xdr, opts] = freighter.signTransaction.mock.calls[0];
    expect(opts).toEqual({ networkPassphrase: Networks.TESTNET });

    const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
    expect(tx.operations).toHaveLength(1);
    const op = tx.operations[0] as { type: string; name: string; value: Buffer };
    expect(op.type).toBe('manageData');
    expect(op.name).toBe('sorobanlard_nonce');
    expect(op.value.toString()).toBe('abc123');
  });

  it('signNonce sets a 30 second timeout', async () => {
    await signNonce('abc123', Networks.TESTNET);
    const tx = TransactionBuilder.fromXDR(
      freighter.signTransaction.mock.calls[0][0],
      Networks.TESTNET,
    );
    const nowSeconds = Math.floor(Date.now() / 1000);
    const maxTime = Number(tx.timeBounds!.maxTime);
    expect(maxTime).toBeGreaterThanOrEqual(nowSeconds + 29);
    expect(maxTime).toBeLessThanOrEqual(nowSeconds + 31);
  });

  it('signNonce rejects a nonce longer than 64 bytes', async () => {
    await expect(signNonce('x'.repeat(65), Networks.TESTNET)).rejects.toThrow();
    expect(freighter.signTransaction).not.toHaveBeenCalled();
  });
});
