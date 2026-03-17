# Setting Up Google Gemini Free Plan

This guide will help you set up Google Gemini with the free plan for the video calling application.

## Step 1: Get Your Gemini API Key

1. **Visit Google AI Studio**: Go to [https://aistudio.google.com/](https://aistudio.google.com/)
2. **Sign In**: Use your Google account to sign in
3. **Get API Key**: 
   - Click on "Get API Key" in the left sidebar
   - Create a new API key
   - Copy the generated API key

## Step 2: Configure the Application

1. **Open `config.js`**: Locate the Gemini configuration section
2. **Replace API Key**: Replace `YOUR_GEMINI_API_KEY` with your actual API key

```javascript
gemini: {
    apiKey: 'YOUR_ACTUAL_API_KEY_HERE', // Paste your key here
    model: 'gemini-1.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
}
```

## Step 3: Free Plan Details

**Gemini 1.5 Flash Free Plan Includes:**
- **Requests per minute**: 15 requests
- **Requests per day**: 1,500 requests  
- **Characters per minute**: 1 million characters
- **Characters per day**: 15 million characters

**Perfect for:**
- Meeting summaries
- Small to medium transcripts
- Testing and development

## Step 4: Test the Integration

1. **Open the Application**: Launch `index.html` in your browser
2. **Join a Call**: Enter your Agora credentials and start a video call
3. **Enable Transcription**: Click "Start" in the transcription panel
4. **Generate Summary**: After some conversation, click "Generate" to test AI summarization

## Troubleshooting

### Common Issues

1. **"API Key Invalid"**
   - Double-check your API key is correctly copied
   - Ensure no extra spaces or characters

2. **"Rate Limit Exceeded"**
   - Free plan has limits (15 requests/minute)
   - Wait a moment and try again

3. **"Quota Exceeded"**
   - Daily limit of 1,500 requests reached
   - Try again tomorrow or upgrade to paid plan

### Error Messages in Console

- **403 Error**: Invalid API key or permissions issue
- **429 Error**: Rate limit exceeded
- **500 Error**: Temporary Google service issue

## Best Practices

1. **Cache Summaries**: Store generated summaries to avoid re-generation
2. **Batch Processing**: For long meetings, consider chunking transcripts
3. **Monitor Usage**: Check your Google AI Studio dashboard for usage stats

## Upgrading if Needed

If you need higher limits, consider upgrading to:
- **Gemini Pro**: More features and higher limits
- **Pay-as-you-go**: Flexible pricing based on usage

Visit [Google AI Pricing](https://ai.google.dev/pricing) for detailed pricing information.

## Security Notes

- **Keep API Key Secure**: Don't commit API keys to public repositories
- **Use HTTPS**: Always use HTTPS in production
- **Consider Backend**: For production, consider moving API calls to a backend server

## Alternative Models

If you hit limits with Gemini 1.5 Flash, you can switch to:
- `gemini-1.5-pro` (more capable, same free limits)
- `gemini-pro` (legacy model, still available)

Simply update the `model` field in `config.js`:

```javascript
model: 'gemini-1.5-pro' // or 'gemini-pro'
```
