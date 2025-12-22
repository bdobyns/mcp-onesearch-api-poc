#!/usr/bin/env node
import readline from 'readline';
import { DoiResource } from './dist/resources/DoiResource.js'; // adjust path

const resource = new DoiResource();

// CLI setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Enter DOI (e.g., 10.1056/CLINraNA59612)> ',
});

rl.prompt();

rl.on('line', async (line) => {
  const doiInput = line.trim();
  if (!doiInput) {
    rl.prompt();
    return;
  }
  
  // Remove leading/trailing quotes
  doiInput = doiInput.replace(/^"+|"+$/g, '');
  // Remove leading 'doi://'
  doiInput = doiInput.replace(/^doi:\/\//i, '');
  
  try {
    // Resolve the URI by replacing the {doi} template
    resource.uri = `doi://${doiInput}`;

    console.log(`\n[DEBUG] Calling DoiResource.read() with DOI: ${doiInput}`);

    // Call the resource
    const result = await resource.read();

    // Inspect the result
    if (Array.isArray(result)) {
      console.log('✅ Result(s):');
      result.forEach((r, i) => {
        console.log(`Result ${i + 1}:`);
        console.log(`URI: ${r.uri}`);
        console.log(`MIME Type: ${r.mimeType}`);
        console.log(`Data: ${r.data}\n`);
      });
    } else {
      console.log('✅ Result:', result);
    }
  } catch (err) {
    console.error('❌ Error:', err.message || err);
  }

  rl.prompt();
}).on('close', () => {
  console.log('Exiting DoiResource debug console.');
  process.exit(0);
});
