# Contributing to ETTJ DI1

Thank you for your interest in contributing to ETTJ DI1! This document provides guidelines for contributing to this educational project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Contributions](#making-contributions)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Code of Conduct

This is an educational project. Please be respectful and constructive in all interactions. We welcome contributions from developers of all experience levels.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ and pip
- Git
- Expo CLI (`npm install -g expo-cli`)
- A code editor (VS Code recommended)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/project-ettj.git
   cd project-ettj
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv

   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate

   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Set up the mobile app**
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

4. **Configure environment**
   ```bash
   # In mobile directory
   cp .env.example .env
   # Edit .env with your local IP if testing on physical device
   ```

## Project Structure

```
project-ettj/
├── backend/                 # Python FastAPI server
│   ├── main.py              # API endpoints
│   ├── services/
│   │   ├── data.py          # DI1 data fetching
│   │   └── models.py        # Interpolation methods
│   └── requirements.txt
├── mobile/                  # Expo React Native app
│   ├── app/                 # Screens (expo-router)
│   ├── components/          # Reusable UI components
│   ├── context/             # React Context providers
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API client
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   └── constants/           # Configuration constants
├── CLAUDE.md                # Project instructions
└── README.md                # Project documentation
```

## Making Contributions

### Types of Contributions

We welcome:
- **Bug fixes**: Found a bug? Submit a fix!
- **Documentation**: Improve README, add comments, fix typos
- **New features**: Propose new features through issues first
- **Tests**: Increase test coverage
- **Translations**: Help translate to other languages

### Contribution Process

1. **Check existing issues** to see if your contribution is already being worked on
2. **Open an issue** for new features or significant changes to discuss first
3. **Fork the repository** and create a feature branch
4. **Make your changes** following the code style guide
5. **Write tests** for new functionality
6. **Submit a pull request**

## Code Style

### TypeScript (Mobile)

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use `const` for constants, `let` only when necessary
- Export named functions, not default when possible
- Document complex functions with JSDoc comments

```typescript
/**
 * Formats a date in Brazilian format (DD/MM/YYYY)
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDateBR(date: Date): string {
  // Implementation
}
```

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints
- Document functions with docstrings
- Use descriptive variable names

```python
def calculate_curve(
    contracts: list[DI1Contract],
    method: str,
    **kwargs
) -> CurveResult:
    """
    Calculate interpolated yield curve from DI1 contracts.

    Args:
        contracts: List of DI1 contract data
        method: Interpolation method name
        **kwargs: Additional method-specific parameters

    Returns:
        CurveResult with interpolated points
    """
    pass
```

### Commit Messages

Use conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code change that doesn't fix bug or add feature
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(mobile): add date picker component
fix(api): handle empty contracts array
docs: update installation instructions
```

## Testing

### Mobile Tests

```bash
cd mobile
npm test              # Run all tests
npm test:watch        # Watch mode
npm test:coverage     # With coverage report
```

### Backend Tests

```bash
cd backend
pytest                # Run all tests
pytest --cov          # With coverage
```

### Testing Guidelines

- Write tests for new functionality
- Maintain existing test coverage
- Test edge cases and error conditions
- Mock external dependencies (API calls, network)

## Submitting Changes

### Pull Request Checklist

Before submitting:

- [ ] Code follows project style guidelines
- [ ] Tests pass (`npm test` and `pytest`)
- [ ] New code has test coverage
- [ ] Documentation is updated if needed
- [ ] Commit messages follow convention
- [ ] PR description explains the changes

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
How were these changes tested?

## Screenshots (if applicable)

## Related Issues
Fixes #123
```

## Questions?

If you have questions about contributing:
1. Check existing documentation
2. Search closed issues
3. Open a new issue with the "question" label

Thank you for contributing to ETTJ DI1!
