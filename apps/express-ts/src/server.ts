/**
 * Azoth DAO AI Agent Server
 *
 * Main Express server combining:
 * - nilDB: Encrypted storage for DAO conversations
 * - nilAI: Private LLM inference in TEE
 * - x402: Pay-per-query payment system
 * - ERC-8004: Agent registration
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import services
import { NilaiService } from './services/nilai.service.js';
import { getQueryPrice } from './config/payment.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS
app.use(cors({
  origin: '*',
}));
app.use(express.json());

console.log('[INFO] Starting Azoth DAO AI Agent...');

// Initialize nilAI service
const nilaiService = new NilaiService();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'azoth-dao-agent',
  });
});

// Agent info endpoint
app.get('/agent', (_req, res) => {
  res.json({
    name: 'Azoth DAO AI Advisor',
    description: 'Privacy-preserving AI assistant for DAO proposal analysis and governance advice',
    capabilities: ['proposal-analysis', 'governance-advice', 'risk-assessment'],
    pricing: {
      model: 'pay-per-query',
      price: getQueryPrice(),
      paymentMethod: 'x402-usdc',
    },
    privacy: {
      inference: 'TEE (Trusted Execution Environment)',
      storage: 'nilDB (encrypted distributed storage)',
    },
    agentId: process.env.AGENT_ID || 'pending-registration',
  });
});

// Simple chat endpoint (free, no nilDB for now)
app.post('/api/chat/free', async (req, res) => {
  try {
    const { prompt, proposalContext } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('[INFO] Processing chat request...');
    console.log('[INFO] Prompt:', prompt.substring(0, 100));
    console.log('[INFO] Has proposal context:', !!proposalContext);
    
    const responseText = await nilaiService.processQuery(prompt, proposalContext);
    
    console.log('[INFO] Response received, length:', responseText?.length || 0);
    
    res.json({
      response: responseText,
      model: nilaiService.getModel(),
    });
  } catch (error) {
    console.error('[ERROR] Chat failed:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('═'.repeat(50));
  console.log('  Azoth DAO AI Agent Server');
  console.log('═'.repeat(50));
  console.log(`  URL:          http://localhost:${PORT}`);
  console.log('═'.repeat(50));
  console.log('');
});
