import { Controller, Get, Post, Query, Req, Res, Body, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { GithubService } from './github.service';

@Controller('api/github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  /**
   * Initiate GitHub OAuth flow
   * GET /api/github/oauth/authorize
   */
  @Get('oauth/authorize')
  initiateOAuth(@Res() res: Response) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/api/github/oauth/callback';
    const scope = 'repo,user:email'; // Permissions needed for Karen

    if (!clientId) {
      throw new Error('GITHUB_CLIENT_ID not configured');
    }

    // Redirect to GitHub OAuth authorization page
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${Date.now()}`;

    res.redirect(authUrl);
  }

  /**
   * GitHub OAuth callback
   * GET /api/github/oauth/callback?code=xxx
   */
  @Get('oauth/callback')
  async handleOAuthCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      return res.status(400).send('Authorization code missing');
    }

    try {
      // Exchange code for access token
      const tokenResult = await this.githubService.exchangeCodeForToken(code);

      if (tokenResult.isErr()) {
        return res.status(500).send(`OAuth error: ${tokenResult.error.message}`);
      }

      const { accessToken, scope } = tokenResult.value;

      // Get user info
      const userResult = await this.githubService.getGitHubUser(accessToken);

      if (userResult.isErr()) {
        return res.status(500).send(`Failed to get user: ${userResult.error.message}`);
      }

      const user = userResult.value;

      // In production, you'd:
      // 1. Store the accessToken in your database (encrypted!)
      // 2. Associate it with your user session
      // 3. Redirect to your app with a success message

      // For now, we'll just show success
      res.send(`
        <html>
          <head><title>GitHub Connected!</title></head>
          <body style="font-family: system-ui; max-width: 600px; margin: 100px auto; text-align: center;">
            <h1>💅 GitHub Connected Successfully!</h1>
            <p>Hey <strong>${user.login}</strong>! Karen can now create PRs on your behalf.</p>
            <p><small>Access token: ${accessToken.substring(0, 10)}...***</small></p>
            <p><small>Scopes: ${scope}</small></p>
            <p style="margin-top: 40px; color: #666;">You can close this window now.</p>
          </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send(`Unexpected error: ${error.message}`);
    }
  }

  /**
   * Create a PR with fixes (requires auth token)
   * POST /api/github/create-pr
   * Body: { accessToken: string, repoUrl: string, issues: Issue[] }
   */
  @Post('create-pr')
  async createPullRequest(@Body() body: { accessToken: string; repoUrl: string; issues: any[] }) {
    const { accessToken, repoUrl, issues } = body;

    if (!accessToken || !repoUrl || !issues) {
      throw new UnauthorizedException('Missing required fields: accessToken, repoUrl, or issues');
    }

    const result = await this.githubService.createPullRequest({
      accessToken,
      repoUrl,
      issues,
    });

    if (result.isErr()) {
      throw new UnauthorizedException(result.error.message);
    }

    return {
      success: true,
      prUrl: result.value,
      message: `💅 Karen created a PR with ${issues.length} fixes!`,
    };
  }

  /**
   * Webhook endpoint for automated PR creation
   * POST /api/github/webhook
   *
   * This endpoint can be called after an audit completes to automatically create PRs
   */
  @Post('webhook')
  async handleWebhook(@Body() body: { accessToken: string; auditId: string; repoUrl: string }) {
    // In production, you'd:
    // 1. Verify webhook signature
    // 2. Fetch audit results from database using auditId
    // 3. Create PR automatically
    // 4. Notify user via email/Slack

    return {
      success: true,
      message: 'Webhook received (not yet implemented)',
    };
  }

  /**
   * Get user's GitHub repositories
   * GET /api/github/repos?access_token=xxx
   */
  @Get('repos')
  async getUserRepos(@Query('access_token') accessToken: string) {
    if (!accessToken) {
      throw new UnauthorizedException('Access token required');
    }

    const result = await this.githubService.getUserRepositories(accessToken);

    if (result.isErr()) {
      throw new UnauthorizedException(result.error.message);
    }

    return {
      success: true,
      repos: result.value,
    };
  }
}
