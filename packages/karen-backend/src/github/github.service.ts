import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { type ServiceResult, ok, err, ServiceError, resultify } from '../common/result';
import axios from 'axios';

export interface PullRequestParams {
  repoUrl: string;
  accessToken: string;
  issues: any[];
}

@Injectable()
export class GithubService {
  async createPullRequest(params: PullRequestParams): Promise<ServiceResult<string>> {
    return resultify(
      async () => {
        const octokit = new Octokit({ auth: params.accessToken });
        const [owner, repo] = this.parseRepoUrl(params.repoUrl);

        // Get main branch SHA
        const { data: mainBranch } = await octokit.repos.getBranch({
          owner,
          repo,
          branch: 'main',
        });

        const mainSha = mainBranch.commit.sha;

        // Create new branch
        const branchName = `karen-fixes-${Date.now()}`;
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branchName}`,
          sha: mainSha,
        });

        // Group issues by file
        const fileChanges = this.groupIssuesByFile(params.issues);

        // Apply fixes to files
        for (const [filePath, fileIssues] of Object.entries(fileChanges)) {
          await this.applyFixesToFile(octokit, owner, repo, branchName, filePath, fileIssues);
        }

        // Create PR
        const prBody = this.buildPRDescription(params.issues);
        const { data: pr } = await octokit.pulls.create({
          owner,
          repo,
          title: `🔧 Karen found ${params.issues.length} layout issues`,
          head: branchName,
          base: 'main',
          body: prBody,
        });

        return pr.html_url;
      },
      (error) => ServiceError.githubError('Failed to create pull request', error)
    );
  }

  private parseRepoUrl(repoUrl: string): [string, string] {
    const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    return [match[1], match[2]];
  }

  private groupIssuesByFile(issues: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const issue of issues) {
      if (issue.fix?.code?.file) {
        const file = issue.fix.code.file;
        if (!grouped[file]) grouped[file] = [];
        grouped[file].push(issue);
      }
    }

    return grouped;
  }

  private async applyFixesToFile(
    octokit: Octokit,
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    issues: any[]
  ): Promise<void> {
    // Get current file content
    let fileContent = '';
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branch,
      });

      if ('content' in data) {
        fileContent = Buffer.from(data.content, 'base64').toString();
      }
    } catch (error) {
      // File doesn't exist, create it
      fileContent = '';
    }

    // Apply fixes
    let updatedContent = fileContent;
    for (const issue of issues) {
      if (issue.fix?.code) {
        updatedContent = this.applyFix(updatedContent, issue.fix.code);
      }
    }

    // Commit file
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `Fix: ${issues.map((i) => i.type).join(', ')} issues`,
      content: Buffer.from(updatedContent).toString('base64'),
      branch,
    });
  }

  private applyFix(content: string, fix: { before: string; after: string }): string {
    return content.replace(fix.before, fix.after);
  }

  private buildPRDescription(issues: any[]): string {
    const critical = issues.filter((i) => i.severity === 'critical');
    const high = issues.filter((i) => i.severity === 'high');
    const medium = issues.filter((i) => i.severity === 'medium');
    const low = issues.filter((i) => i.severity === 'low');

    // Group files changed
    const filesChanged = new Map<string, number>();
    issues.forEach((issue) => {
      if (issue.fix?.code?.file) {
        const file = issue.fix.code.file;
        filesChanged.set(file, (filesChanged.get(file) || 0) + 1);
      }
    });

    let description = `# 💅 Karen's CSS Makeover

Hi there! Karen here. I audited your site and found **${issues.length} layout issues** that are making your design look like it was created in the MySpace era. I took the liberty of fixing them for you.

## What I Fixed

- ✅ ${high.length} high priority issues (these were embarrassing)
- ✅ ${medium.length} medium priority issues (not great, not terrible)
- ✅ ${low.length} low priority issues (minor nitpicks, but still...)

## Issues by Type

`;

    // Group by type
    const byType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(byType).forEach(([type, count]) => {
      description += `- **${type}**: ${count} issues\n`;
    });

    description += `\n## Files Changed\n\n`;

    Array.from(filesChanged.entries()).forEach(([file, count]) => {
      description += `- \`${file}\` (${count} fixes)\n`;
    });

    if (critical.length > 0) {
      description += `\n## 🚨 Critical Issues\n\n`;
      critical.slice(0, 3).forEach((i) => {
        description += `### ${i.type}: ${i.element || 'Multiple elements'}\n`;
        description += `**Viewport:** ${i.viewport}\n\n`;
        description += `> ${i.message}\n\n`;
        if (i.fix?.code) {
          description += `\`\`\`css\n/* Before */\n${i.fix.code.before || '/* N/A */'}\n\n/* After */\n${i.fix.code.after || '/* N/A */'}\n\`\`\`\n\n`;
        }
      });
      if (critical.length > 3) {
        description += `\n...and ${critical.length - 3} more critical issues!\n\n`;
      }
    }

    if (high.length > 0) {
      description += `\n## ⚠️ High Priority Issues\n\n`;
      high.slice(0, 3).forEach((i) => {
        description += `- **${i.type}** (${i.viewport}): ${i.message}\n`;
      });
      if (high.length > 3) {
        description += `\n...and ${high.length - 3} more high priority issues!\n\n`;
      }
    }

    description += `\n## Testing Checklist

Before merging, please verify:

- [ ] All fixes render correctly across viewports
- [ ] No regression in existing functionality
- [ ] Design looks better than before (it definitely does)
- [ ] Run your existing tests

## Need Help?

If any fix breaks something (unlikely, but possible), just revert that specific change. Karen's not perfect, but she's pretty darn close.

---

💅 **Generated by [Karen CLI](https://github.com/SaharBarak/KarenCLI)** via the managed service

Merge this PR and your site will finally look professional. You're welcome.`;

    return description;
  }

  /**
   * Exchange OAuth authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<ServiceResult<{ accessToken: string; scope: string }>> {
    return resultify(
      async () => {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          throw new Error('GitHub OAuth credentials not configured');
        }

        const response = await axios.post(
          'https://github.com/login/oauth/access_token',
          {
            client_id: clientId,
            client_secret: clientSecret,
            code,
          },
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        const { access_token, scope } = response.data;

        if (!access_token) {
          throw new Error('Failed to exchange code for token');
        }

        return {
          accessToken: access_token,
          scope: scope || '',
        };
      },
      (error) => ServiceError.githubError('OAuth token exchange failed', error)
    );
  }

  /**
   * Get GitHub user information
   */
  async getGitHubUser(accessToken: string): Promise<ServiceResult<any>> {
    return resultify(
      async () => {
        const octokit = new Octokit({ auth: accessToken });
        const { data: user } = await octokit.users.getAuthenticated();
        return user;
      },
      (error) => ServiceError.githubError('Failed to fetch GitHub user', error)
    );
  }

  /**
   * Get user's GitHub repositories
   */
  async getUserRepositories(accessToken: string): Promise<ServiceResult<any[]>> {
    return resultify(
      async () => {
        const octokit = new Octokit({ auth: accessToken });
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
          sort: 'updated',
          per_page: 100,
        });
        return repos;
      },
      (error) => ServiceError.githubError('Failed to fetch repositories', error)
    );
  }
}
