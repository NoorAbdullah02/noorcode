# @noorcode/cli

A terminal-based AI coding agent. Plan, chat, and build inside your local project.

## Prerequisites (Installing Bun)

NoorCode is powered by the **Bun** runtime. You must install Bun first before installing the CLI.

### Installing Bun on Windows (PowerShell)
1. Open PowerShell and run this command:
   ```powershell
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```
2. Verify it is installed by running:
   ```powershell
   bun --version
   ```

*Note: If Windows says `'bun' is not recognized`, you need to add Bun to your environment variables:*
1. Press the **Windows Key**, type `env`, and select **Edit the system environment variables**.
2. Click the **Environment Variables...** button.
3. In the **User variables** section at the top, select **Path** and click **Edit...**.
4. Click **New** and paste the path to your Bun bin folder:
   `C:\Users\<YourUsername>\.bun\bin` *(Replace `<YourUsername>` with your actual Windows username)*.
5. Click **OK** on all windows, close your terminal, and open a new PowerShell window.

### Installing Bun on macOS / Linux
Run the following command in your terminal:
```bash
curl -fsSL https://bun.sh/install | bash
```

---

## Installation

Once Bun is installed, install the NoorCode CLI globally on your machine:

```bash
npm install -g @noorcode/cli@latest
```

## Usage

After installation, simply navigate to your project directory and run the CLI:

```bash
noorcode
```

## Features

- **Terminal AI Chat**: Run an AI coding assistant directly in your terminal with a React-powered interface rendered at 60 fps.
- **Plan and Build Modes**: Use read-only planning tools or enable file writing, file editing, and shell command execution.
- **Multi-Model Support**: Chat with Anthropic Claude models, Cerebras models (`gemma-4-31b`, `zai-glm-4.7`, `gpt-oss-120b`), Mistral, and DeepSeek.
- **Persistent Sessions**: Syncs and saves full message history with the cloud.
- **Authentication**: Authenticate securely using a browser-based Clerk OAuth flow.
- **Automatic Updates**: The CLI quietly checks npm in the background and notifies you with a top-level banner when a new version is available.

## Support

For issues and documentation, visit the [main repository](https://github.com/NoorAbdullah02/noorcode).
