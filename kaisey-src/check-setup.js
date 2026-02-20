#!/usr/bin/env node

/**
 * Kaisey Setup Verification Script
 * 
 * This script checks if your environment is properly configured
 * and provides helpful feedback for missing credentials.
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 Kaisey Environment Check\n');
console.log('━'.repeat(50));

// Check if .env file exists
const envPath = join(__dirname, '.env');
const envExamplePath = join(__dirname, '.env.example');

if (!existsSync(envPath)) {
  console.log('\n⚠️  No .env file found');
  console.log('\n📋 To fix this:');
  console.log('   1. Copy .env.example to .env');
  console.log('   2. Edit .env with your credentials');
  console.log('\n   $ cp .env.example .env\n');
  
  if (existsSync(envExamplePath)) {
    console.log('✅ .env.example file exists - ready to copy!\n');
  }
  
  process.exit(0);
}

console.log('✅ .env file found\n');

// Read and parse .env file
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) {
      envVars[key] = value;
    }
  }
});

// Check required variables
const checks = [
  {
    name: 'Google OAuth Client ID',
    key: 'VITE_GOOGLE_CLIENT_ID',
    required: false,
    hint: 'Required for Google Calendar integration. Get from: https://console.cloud.google.com/',
  },
  {
    name: 'Google Redirect URI',
    key: 'VITE_GOOGLE_REDIRECT_URI',
    required: false,
    hint: 'Should match your app URL (e.g., http://localhost:5173 for dev)',
  },
  {
    name: 'OpenAI API Key',
    key: 'VITE_OPENAI_API_KEY',
    required: false,
    hint: 'Optional but recommended for AI features. Get from: https://platform.openai.com/api-keys',
  },
];

let hasIssues = false;
let hasWarnings = false;

console.log('Configuration Status:\n');

checks.forEach(check => {
  const value = envVars[check.key];
  const isSet = value && value.length > 0;
  
  if (check.required && !isSet) {
    console.log(`❌ ${check.name}`);
    console.log(`   Missing: ${check.key}`);
    console.log(`   → ${check.hint}\n`);
    hasIssues = true;
  } else if (!isSet) {
    console.log(`⚠️  ${check.name}`);
    console.log(`   Not set: ${check.key}`);
    console.log(`   → ${check.hint}\n`);
    hasWarnings = true;
  } else {
    // Validate format for certain keys
    let valid = true;
    let validationMsg = '';
    
    if (check.key === 'VITE_GOOGLE_CLIENT_ID') {
      if (!value.includes('.apps.googleusercontent.com')) {
        valid = false;
        validationMsg = '   ⚠️  Should end with .apps.googleusercontent.com';
      }
    }
    
    if (check.key === 'VITE_OPENAI_API_KEY') {
      if (!value.startsWith('sk-')) {
        valid = false;
        validationMsg = '   ⚠️  Should start with sk-';
      }
    }
    
    if (check.key === 'VITE_GOOGLE_REDIRECT_URI') {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        valid = false;
        validationMsg = '   ⚠️  Should start with http:// or https://';
      }
    }
    
    if (valid) {
      const preview = value.length > 40 ? value.substring(0, 40) + '...' : value;
      console.log(`✅ ${check.name}`);
      console.log(`   ${preview}\n`);
    } else {
      console.log(`⚠️  ${check.name}`);
      console.log(`   ${value}`);
      console.log(`${validationMsg}\n`);
      hasWarnings = true;
    }
  }
});

console.log('━'.repeat(50));

// Summary
if (hasIssues) {
  console.log('\n❌ Setup incomplete - please fix the issues above\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Setup has warnings but you can proceed\n');
  console.log('💡 Options:\n');
  console.log('   1. Fix warnings above for full functionality');
  console.log('   2. Use Demo Mode to explore without credentials\n');
  console.log('Ready to start:\n');
  console.log('   $ npm run dev\n');
  process.exit(0);
} else {
  console.log('\n✅ All credentials configured!\n');
  console.log('Ready to start:\n');
  console.log('   $ npm run dev\n');
  process.exit(0);
}
