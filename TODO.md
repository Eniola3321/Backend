# OAuth2.0 Login Token Generation Task

## Steps to Complete

- [x] Modify `redirectToGoogle` in `src/api/v1/controllers/gmail.controller.ts`:

  - Remove requirement for JWT in Authorization header.
  - Generate Google auth URL without state parameter.

- [x] Modify `googleCallback` in `src/api/v1/controllers/gmail.controller.ts`:

  - Fetch user profile from Google OAuth2 API.
  - Find or create user in database based on email (OAuth users without password).
  - Generate JWT token using AuthService.signToken.
  - Store OAuth tokens in database.
  - Return JSON response with JWT token and user info instead of redirect.

- [x] Update `AuthService` in `src/api/v1/services/authService.ts`:

  - Add method to find or create OAuth user.
  - Ensure JWT generation works for OAuth users.

- [ ] Test OAuth login flow:
  - Verify JWT token is generated and can be used for protected routes like subscription.
