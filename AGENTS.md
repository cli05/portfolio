# Project context

- We will be working within the `cli05/portfolio` GitHub repository: https://github.com/cli05/portfolio.
- The repository's default branch is `main`.
- This personal website workspace is for work on that portfolio repository.

# Development workflow

- Use one descriptive branch per task, such as `codex/update-projects`, starting from the latest `origin/main`.
- Keep `main` ready to deploy. Make development changes on task branches rather than committing directly to `main`.
- Use a separate Git worktree and branch for each task when multiple chats work in parallel.
- Inspect the repository's setup before making changes. Run checks relevant to the change and preview UI changes locally.
- Make focused commits, push the task branch, and open a pull request into `main` with a concise description and validation results.
- Handle implementation, checks, commits, branch pushes, and pull request creation autonomously within the requested task's scope. Leave merging to the user unless they explicitly authorize it.
- Prefer squash merging after approval to keep `main` history tidy.
- Use branch previews when supported by the hosting setup.
