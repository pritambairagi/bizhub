import fs from 'fs';
import path from 'path';

const controllersDir = 'd:/claude/POS/server/src/controllers';
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Step 1: Fix all corrupted "as stringX as string" patterns
  content = content.replace(/ as string[a-z]* as string/g, ' as string');
  
  // Step 2: Fix "req.params.WORD as string" → "req.params['WORD'] as string"
  // This handles cases like req.params.id as string, req.params.branchId as string, etc.
  content = content.replace(/req\.params\.(\w+) as string/g, "req.params['$1'] as string");
  
  // Step 3: Fix plain "req.params.WORD" (no as string) that doesn't have bracket notation
  content = content.replace(/req\.params\.(\w+)(?! as string)(?!['"])/g, "req.params['$1'] as string");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
}

console.log('Done!');
