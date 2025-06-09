require('dotenv').config();
const { OpenAIClient } = require('@azure/openai');
const { AzureKeyCredential } = require('@azure/core-auth');

let client = null;

if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_KEY) {
  try {
    const credential = new AzureKeyCredential(process.env.AZURE_OPENAI_KEY);
    client = new OpenAIClient(process.env.AZURE_OPENAI_ENDPOINT, credential);
    console.log('Azure OpenAI Client initialized successfully (centralized).');
  } catch (e) {
    console.error('Failed to initialize central Azure OpenAI Client. Error:', e.message, e.stack);
  }
} else {
  console.warn('Azure OpenAI environment variables (ENDPOINT, KEY) not set. OpenAI client will not be available.');
}

module.exports = { openAIClient: client };
