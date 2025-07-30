# OpenAI Integration Setup Guide

## 🚀 Setting Up Advanced AI for Onboarding Plans

### Step 1: Get Your OpenAI API Key

1. **Go to OpenAI Platform**: Visit [https://platform.openai.com/](https://platform.openai.com/)
2. **Sign In**: Use your ChatGPT Plus account credentials
3. **Navigate to API Keys**: Go to "API Keys" in the left sidebar
4. **Create New Key**: Click "Create new secret key"
5. **Copy the Key**: Save this key securely - you won't be able to see it again

### Step 2: Add API Key to Environment Variables

1. **Open your `.env.local` file** in the project root
2. **Add the OpenAI API key**:
   ```bash
   # Add this line to your .env.local file
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. **Replace `your_openai_api_key_here`** with your actual API key

### Step 3: Restart Your Development Server

```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 4: Test the Integration

1. **Add a new hire** through the manager dashboard
2. **Check the onboarding plan** - it should now be AI-generated
3. **View AI recommendations** on the manager dashboard

## 🎯 What You'll Get with AI Integration

### **Before (Basic Templates):**
- Generic tasks for everyone
- Same content regardless of role
- Basic milestone structure

### **After (AI-Powered):**
- **Role-specific tasks** tailored to each position
- **Personalized insights** based on company context
- **Dynamic recommendations** that adapt to team data
- **Intelligent scheduling** with proper dependencies
- **Rich descriptions** with learning objectives and success metrics

## 💰 Cost Considerations

### **API Usage:**
- **GPT-4**: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- **Typical onboarding plan**: ~2,000-3,000 tokens total
- **Cost per plan**: ~$0.15-0.25
- **Monthly cost** (10 new hires): ~$1.50-2.50

### **Cost Optimization:**
- Plans are cached in database after generation
- Only regenerate when needed
- Fallback to basic templates if API fails

## 🔧 Advanced Configuration

### **Customize AI Behavior:**

1. **Edit `src/lib/openaiService.ts`**:
   ```typescript
   // Adjust temperature for creativity vs consistency
   temperature: 0.7, // 0.0 = very consistent, 1.0 = very creative
   
   // Adjust max tokens for response length
   max_tokens: 4000, // Increase for longer plans
   ```

2. **Add Company Context**:
   ```typescript
   // In the AI service, add your company specifics
   companyContext: {
     industry: "Technology",
     size: "50-200 employees",
     culture: "Fast-paced, collaborative",
     tools: ["Slack", "Jira", "GitHub"],
     processes: ["Agile", "Code Review", "Daily Standups"]
   }
   ```

### **Monitor Usage:**

1. **Check OpenAI Dashboard**: [https://platform.openai.com/usage](https://platform.openai.com/usage)
2. **Set Usage Limits**: Configure spending limits in your OpenAI account
3. **Monitor Costs**: Track usage patterns and optimize as needed

## 🛠️ Troubleshooting

### **Common Issues:**

1. **"Invalid API Key" Error**:
   - Verify your API key is correct
   - Ensure it's added to `.env.local`
   - Restart the development server

2. **"Rate Limit Exceeded"**:
   - Wait a few minutes before retrying
   - Consider upgrading your OpenAI plan
   - Implement rate limiting in your app

3. **"Model Not Available"**:
   - Ensure you have access to GPT-4
   - Check your OpenAI account status
   - Consider using GPT-3.5-turbo as fallback

### **Fallback System:**

If AI generation fails, the system will:
1. Log the error for debugging
2. Use the basic template system
3. Show a user-friendly message
4. Continue functioning normally

## 🎉 Next Steps

Once setup is complete:

1. **Test with different roles** to see AI personalization
2. **Monitor the quality** of generated plans
3. **Provide feedback** to improve the AI prompts
4. **Consider adding more context** for better personalization

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key and environment variables
3. Check the OpenAI dashboard for usage and errors
4. Review the server logs for detailed error information

---

**Ready to revolutionize your onboarding experience with AI! 🚀** 