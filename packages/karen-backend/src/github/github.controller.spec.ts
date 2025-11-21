import { Test, TestingModule } from '@nestjs/testing';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { ok, err } from 'neverthrow';
import { ServiceError } from '../common/result';

describe('GithubController', () => {
  let controller: GithubController;
  let githubService: jest.Mocked<GithubService>;

  beforeEach(async () => {
    const mockGithubService = {
      exchangeCodeForToken: jest.fn(),
      getGitHubUser: jest.fn(),
      createPullRequest: jest.fn(),
      getUserRepositories: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubController],
      providers: [{ provide: GithubService, useValue: mockGithubService }],
    }).compile();

    controller = module.get<GithubController>(GithubController);
    githubService = module.get(GithubService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateOAuth', () => {
    it('should redirect to GitHub OAuth page', () => {
      process.env.GITHUB_CLIENT_ID = 'test-client-id';
      process.env.GITHUB_REDIRECT_URI = 'http://localhost:3000/api/github/oauth/callback';

      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      controller.initiateOAuth(mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('https://github.com/login/oauth/authorize')
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('client_id=test-client-id')
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('scope=repo,user:email')
      );
    });

    it('should throw error when client ID not configured', () => {
      delete process.env.GITHUB_CLIENT_ID;

      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      expect(() => controller.initiateOAuth(mockResponse)).toThrow(
        'GITHUB_CLIENT_ID not configured'
      );
    });

    it('should use default redirect URI when not configured', () => {
      process.env.GITHUB_CLIENT_ID = 'test-client-id';
      delete process.env.GITHUB_REDIRECT_URI;

      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      controller.initiateOAuth(mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fgithub%2Foauth%2Fcallback')
      );
    });

    it('should include state parameter for CSRF protection', () => {
      process.env.GITHUB_CLIENT_ID = 'test-client-id';

      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      controller.initiateOAuth(mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('state=')
      );
    });
  });

  describe('handleOAuthCallback', () => {
    it('should exchange code for token and display success page', async () => {
      const mockAccessToken = 'gho_test_token_123';
      const mockUser = {
        login: 'testuser',
        name: 'Test User',
      };

      githubService.exchangeCodeForToken.mockResolvedValue(
        ok({
          accessToken: mockAccessToken,
          scope: 'repo,user:email',
        })
      );

      githubService.getGitHubUser.mockResolvedValue(ok(mockUser));

      const mockResponse = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.handleOAuthCallback('test-auth-code', mockResponse);

      expect(githubService.exchangeCodeForToken).toHaveBeenCalledWith('test-auth-code');
      expect(githubService.getGitHubUser).toHaveBeenCalledWith(mockAccessToken);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('GitHub Connected Successfully!')
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('testuser')
      );
    });

    it('should return error when code is missing', async () => {
      const mockResponse = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.handleOAuthCallback('', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith('Authorization code missing');
    });

    it('should handle token exchange failure', async () => {
      githubService.exchangeCodeForToken.mockResolvedValue(
        err(ServiceError.githubError('Token exchange failed', new Error()))
      );

      const mockResponse = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.handleOAuthCallback('test-code', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('OAuth error')
      );
    });

    it('should handle user fetch failure', async () => {
      githubService.exchangeCodeForToken.mockResolvedValue(
        ok({
          accessToken: 'gho_test_token',
          scope: 'repo',
        })
      );

      githubService.getGitHubUser.mockResolvedValue(
        err(ServiceError.githubError('Failed to fetch user', new Error()))
      );

      const mockResponse = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.handleOAuthCallback('test-code', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get user')
      );
    });

    it('should include access token and scope in response', async () => {
      const mockToken = 'gho_test_token_123456';
      githubService.exchangeCodeForToken.mockResolvedValue(
        ok({
          accessToken: mockToken,
          scope: 'repo,user:email',
        })
      );

      githubService.getGitHubUser.mockResolvedValue(
        ok({
          login: 'testuser',
        })
      );

      const mockResponse = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.handleOAuthCallback('test-code', mockResponse);

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining(mockToken.substring(0, 10))
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('repo,user:email')
      );
    });
  });

  describe('createPullRequest', () => {
    it('should create PR with fixes', async () => {
      const body = {
        accessToken: 'gho_test_token',
        repoUrl: 'https://github.com/owner/repo',
        issues: [
          {
            type: 'overflow',
            severity: 'critical',
            fix: {
              code: {
                file: 'test.tsx',
                before: 'old',
                after: 'new',
              },
            },
          },
        ],
      };

      const prUrl = 'https://github.com/owner/repo/pull/123';
      githubService.createPullRequest.mockResolvedValue(ok(prUrl));

      const result = await controller.createPullRequest(body);

      expect(result).toEqual({
        success: true,
        prUrl,
        message: '💅 Karen created a PR with 1 fixes!',
      });

      expect(githubService.createPullRequest).toHaveBeenCalledWith({
        accessToken: body.accessToken,
        repoUrl: body.repoUrl,
        issues: body.issues,
      });
    });

    it('should throw UnauthorizedException when accessToken missing', async () => {
      const body = {
        accessToken: '',
        repoUrl: 'https://github.com/owner/repo',
        issues: [],
      };

      await expect(controller.createPullRequest(body)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when repoUrl missing', async () => {
      const body = {
        accessToken: 'gho_test_token',
        repoUrl: '',
        issues: [],
      };

      await expect(controller.createPullRequest(body)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when issues missing', async () => {
      const body = {
        accessToken: 'gho_test_token',
        repoUrl: 'https://github.com/owner/repo',
        issues: undefined as any,
      };

      await expect(controller.createPullRequest(body)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should handle PR creation failure', async () => {
      const body = {
        accessToken: 'gho_test_token',
        repoUrl: 'https://github.com/owner/repo',
        issues: [{ type: 'overflow' }],
      };

      githubService.createPullRequest.mockResolvedValue(
        err(ServiceError.githubError('PR creation failed', new Error()))
      );

      await expect(controller.createPullRequest(body)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('getUserRepos', () => {
    it('should return user repositories', async () => {
      const mockRepos = [
        {
          full_name: 'testuser/repo1',
          description: 'Test repo 1',
          default_branch: 'main',
        },
        {
          full_name: 'testuser/repo2',
          description: 'Test repo 2',
          default_branch: 'master',
        },
      ];

      githubService.getUserRepositories.mockResolvedValue(ok(mockRepos));

      const result = await controller.getUserRepos('gho_test_token');

      expect(result).toEqual({
        success: true,
        repos: mockRepos,
      });
    });

    it('should throw UnauthorizedException when token missing', async () => {
      await expect(controller.getUserRepos('')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should handle repo fetch failure', async () => {
      githubService.getUserRepositories.mockResolvedValue(
        err(ServiceError.githubError('Failed to fetch repos', new Error()))
      );

      await expect(controller.getUserRepos('gho_test_token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('handleWebhook', () => {
    it('should return success message (placeholder)', async () => {
      const body = {
        accessToken: 'gho_test_token',
        auditId: 'audit-123',
        repoUrl: 'https://github.com/owner/repo',
      };

      const result = await controller.handleWebhook(body);

      expect(result).toEqual({
        success: true,
        message: 'Webhook received (not yet implemented)',
      });
    });
  });
});
