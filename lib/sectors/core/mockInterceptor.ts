import fs from 'fs';
import path from 'path';

const MOCK_FILE_PATH = path.join(process.cwd(), 'lib', 'data', 'api-mock-db.json');

// Memory cache for the mock DB to prevent parsing it repeatedly
let mockDb: Record<string, any> | null = null;

function getMockDb(): Record<string, any> {
  if (mockDb) return mockDb;
  try {
    if (fs.existsSync(MOCK_FILE_PATH)) {
      const data = fs.readFileSync(MOCK_FILE_PATH, 'utf-8');
      mockDb = JSON.parse(data);
    } else {
      mockDb = {};
    }
  } catch (err) {
    console.error('Failed to read mock DB:', err);
    mockDb = {};
  }
  return mockDb!;
}

function saveMockDb(db: Record<string, any>) {
  try {
    const dir = path.dirname(MOCK_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MOCK_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
    mockDb = db;
  } catch (err) {
    console.error('Failed to write mock DB:', err);
  }
}

export async function interceptRequest(url: string, executeRealApi: () => Promise<any>): Promise<any> {
  const isMockMode = process.env.MOCK_API === 'true';

  if (!isMockMode) {
    // Normal operation (hits real API without saving/reading from mock)
    return executeRealApi();
  }

  // Remove the domain part to just use the pathname + search as the key
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch (e) {
    return executeRealApi();
  }
  
  const cacheKey = urlObj.pathname + urlObj.search;
  const db = getMockDb();

  // 1. USE MODE: If we are in mock mode and the data exists, return it! (0 latency, 0 quota)
  if (db[cacheKey] !== undefined) {
    console.log(`[MockInterceptor] SERVED FROM MOCK DB: ${cacheKey}`);
    return db[cacheKey];
  }

  // 2. RECORD MODE: If it doesn't exist, we hit the real API
  console.log(`[MockInterceptor] MISSING FROM MOCK DB: ${cacheKey}. Hitting real API and saving to mock db...`);
  const realData = await executeRealApi();

  // Save it to the DB for future uses
  db[cacheKey] = realData;
  saveMockDb(db);
  console.log(`[MockInterceptor] RECORDED TO MOCK DB: ${cacheKey}`);

  return realData;
}
