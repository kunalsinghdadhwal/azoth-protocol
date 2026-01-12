/**
 * ERC-8004 Agent Registration Script
 *
 * Registers the Azoth DAO AI Agent on the ERC-8004 Identity Registry
 */

import 'dotenv/config';
import { ERC8004Service } from './services/erc8004.service.js';
import { getQueryPrice } from './config/payment.js';
import fs from 'fs';
import path from 'path';

async function registerAgent() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Azoth DAO AI Agent - ERC-8004 Registration');
  console.log('═══════════════════════════════════════════════════════\n');

  const erc8004Service = new ERC8004Service();

  // Agent metadata
  const metadata = {
    name: 'Azoth DAO AI Advisor',
    description: 'Privacy-preserving AI assistant for DAO proposal analysis and governance advice. Powered by nilAI TEE infrastructure with encrypted chat history storage.',
    capabilities: [
      'proposal-analysis',
      'governance-advice',
      'risk-assessment',
      'voting-recommendations',
      'ragequit-analysis'
    ],
    pricing: {
      model: 'pay-per-query',
      price: getQueryPrice(),
      currency: 'USDC',
      paymentMethod: 'x402'
    },
    privacy: {
      inference: 'TEE (Trusted Execution Environment)',
      storage: 'nilDB (encrypted distributed storage)',
      provider: 'Nillion'
    },
    endpoints: {
      chat: '/api/chat',
      stream: '/api/chat/stream',
      health: '/health',
      info: '/agent'
    },
    version: '1.0.0',
    registeredAt: new Date().toISOString()
  };

  console.log('[INFO] Agent Metadata:');
  console.log(JSON.stringify(metadata, null, 2));
  console.log('');

  try {
    // Register on ERC-8004
    console.log('[INFO] Registering agent on ERC-8004...');
    const result = await erc8004Service.registerAgent(metadata);

    console.log('\n[SUCCESS] Agent registered successfully!');
    console.log(`  IPFS CID:    ${result.metadataCID}`);
    console.log(`  Agent ID:    ${result.agentId}`);
    console.log(`  TX Hash:     ${result.txHash}`);
    console.log(`  Registry:    ${erc8004Service.getRegistryAddress()}`);

    // Save registration info
    const registrationInfo = {
      agentId: result.agentId,
      metadataCID: result.metadataCID,
      txHash: result.txHash,
      registry: erc8004Service.getRegistryAddress(),
      registeredAt: new Date().toISOString(),
      metadata
    };

    const registrationPath = path.join(process.cwd(), 'registration.json');
    fs.writeFileSync(registrationPath, JSON.stringify(registrationInfo, null, 2));
    console.log(`\n[INFO] Registration info saved to ${registrationPath}`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Add this to your .env file:');
    console.log(`  AGENT_ID=${result.agentId}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('[ERROR] Registration failed:', error);
    process.exit(1);
  }
}

registerAgent();
