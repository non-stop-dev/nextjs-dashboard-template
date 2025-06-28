#!/usr/bin/env node
// Production Security Checker
// Run this before deploying to ensure no development bypasses are active

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking production security...\n');

let hasSecurityIssues = false;

// Check 1: Environment variables
const envFile = path.join(__dirname, '../.env.production');
const envLocalFile = path.join(__dirname, '../.env.local');

function checkEnvFile(filePath, fileName) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('DEV_DAL_BYPASS=true')) {
      console.log(`❌ SECURITY ISSUE: ${fileName} contains DEV_DAL_BYPASS=true`);
      hasSecurityIssues = true;
    }
    
    if (content.includes('NODE_ENV=development') && fileName === '.env.production') {
      console.log(`❌ SECURITY ISSUE: ${fileName} sets NODE_ENV=development`);
      hasSecurityIssues = true;
    }
    
    if (content.includes('localhost') && fileName === '.env.production') {
      console.log(`⚠️  WARNING: ${fileName} contains localhost URLs`);
    }
    
    // Check for weak secrets
    if (content.includes('dev-secret-key') || content.includes('change-in-production')) {
      console.log(`❌ SECURITY ISSUE: ${fileName} contains weak NEXTAUTH_SECRET`);
      hasSecurityIssues = true;
    }
    
    // Check for default credentials
    if (content.includes('username:password@localhost')) {
      console.log(`⚠️  WARNING: ${fileName} contains default database credentials`);
    }
  }
}

checkEnvFile(envFile, '.env.production');
checkEnvFile(envLocalFile, '.env.local');

// Check 2: Code analysis
const filesToCheck = [
  '../src/lib/dal.ts',
  '../src/middleware.ts'
];

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Look for development bypasses
    if (content.includes('DEV_DAL_BYPASS') && !content.includes('// REMOVE FOR PRODUCTION')) {
      console.log(`⚠️  WARNING: ${file} contains development bypass code`);
    }
  }
});

// Check 3: Package.json scripts
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
if (packageJson.scripts.start && packageJson.scripts.start.includes('dev')) {
  console.log('⚠️  WARNING: "start" script uses development mode');
}

// Summary
if (hasSecurityIssues) {
  console.log('\n❌ DEPLOYMENT BLOCKED: Security issues detected!');
  console.log('Fix the issues above before deploying to production.');
  process.exit(1);
} else {
  console.log('\n✅ Security check passed! Safe to deploy.');
  console.log('\nProduction deployment checklist:');
  console.log('□ Remove DEV_DAL_BYPASS from environment');
  console.log('□ Set NODE_ENV=production');
  console.log('□ Configure production database');
  console.log('□ Set secure NEXTAUTH_SECRET');
  console.log('□ Configure OAuth providers');
}