/**
 * nilDB Collection Setup Script
 *
 * Creates the encrypted collection for storing DAO chat history
 */

import 'dotenv/config';
import { initNilDBClient } from '../config/nillion.js';
import { NilDBService } from '../services/nildb.service.js';

async function setupCollection() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  nilDB Collection Setup - Azoth DAO Chat History');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Initialize nilDB client
    console.log('[INFO] Connecting to nilDB nodes...');
    const nildbClient = await initNilDBClient();

    // Initialize service (will create collection if not exists)
    console.log('[INFO] Setting up collection...');
    const nildbService = await NilDBService.initialize(nildbClient);

    const collectionId = nildbService.getCollectionId();

    console.log('\n[SUCCESS] Collection setup complete!');
    console.log(`  Collection ID: ${collectionId}`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Add this to your .env file:');
    console.log(`  NILDB_COLLECTION_ID=${collectionId}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('[ERROR] Collection setup failed:', error);
    process.exit(1);
  }
}

setupCollection();
