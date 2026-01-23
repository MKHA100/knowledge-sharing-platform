---
applyTo: '**'
---
# AI Coding Assistant Instructions

## Core Principles

Always use Context7 when I need code generation, setup or configuration steps, or library/API documentation to ensure you're working with the latest, most accurate information.

When writing code:
- Prioritize readability and maintainability over cleverness
- Write self-documenting code with clear variable and function names
- Include comments only when the "why" isn't obvious from the code itself
- Follow DRY (Don't Repeat Yourself) principles
- Consider edge cases and error handling

## Code Quality Standards

### Error Handling
- Always implement proper error handling with try-catch blocks or error boundaries
- Provide meaningful error messages that help with debugging
- Never silently fail - log errors appropriately
- Validate inputs and handle edge cases

### Security
- Never hardcode sensitive information (API keys, passwords, tokens)
- Use environment variables for configuration
- Sanitize user inputs to prevent injection attacks
- Follow security best practices for the specific framework/language

### Performance
- Consider performance implications of your solutions
- Avoid unnecessary re-renders, loops, or database queries
- Use appropriate data structures for the task
- Implement pagination for large datasets

## Code Style Preferences

### General
- Use meaningful, descriptive names for variables, functions, and components
- Keep functions small and focused on a single responsibility
- Prefer explicit over implicit
- Use early returns to reduce nesting

### TypeScript/JavaScript
- Always use TypeScript when possible for type safety
- Prefer `const` over `let`, avoid `var`
- Use async/await over raw promises for better readability
- Prefer functional programming patterns where appropriate
- Use modern ES6+ features (destructuring, spread operators, arrow functions)

### React
- Prefer functional components with hooks over class components
- Keep components small and composable
- Extract reusable logic into custom hooks
- Use proper dependency arrays in useEffect
- Implement proper loading and error states

### CSS/Styling
- Follow BEM naming convention or use CSS modules/Tailwind
- Mobile-first responsive design
- Prefer flexbox/grid over floats
- Keep specificity low

## Documentation & Explanations

When explaining code:
- Start with a brief overview of what the code does
- Explain any non-obvious design decisions
- Highlight potential gotchas or important considerations
- Provide usage examples when relevant
- Include setup/installation steps if applicable

## Testing
- Write testable code by default
- Suggest test cases for critical functionality
- Include edge cases in test scenarios
- Follow AAA pattern: Arrange, Act, Assert

## When Suggesting Solutions

- Present the recommended approach first
- Mention trade-offs if there are multiple valid approaches
- Consider scalability and maintainability
- Ask clarifying questions if requirements are ambiguous
- Suggest improvements to existing code when relevant

## Framework-Specific Preferences

### Next.js
- Use App Router over Pages Router for new projects
- Implement proper SEO with metadata
- Use Server Components by default, Client Components when needed
- Follow Next.js data fetching best practices

### React Native
- Use TypeScript for type safety
- Follow platform-specific design guidelines (iOS HIG, Material Design)
- Optimize for performance on mobile devices
- Handle platform differences appropriately

### Backend/API
- Follow RESTful principles or GraphQL best practices
- Implement proper authentication and authorization
- Use appropriate HTTP status codes
- Version your APIs
- Document endpoints clearly

## Don't Do This

- Don't generate boilerplate without explanation
- Don't ignore error handling
- Don't create overly complex solutions when simple ones suffice
- Don't use deprecated packages or patterns
- Don't skip input validation
- Don't leave TODOs in production code

## Additional Context

When I'm working on:
- **Bug fixes**: Help me understand the root cause before suggesting fixes
- **New features**: Consider how they fit into the existing architecture
- **Refactoring**: Ensure backward compatibility and suggest migration paths
- **Performance issues**: Profile before optimizing, then optimize bottlenecks

---

*Remember: Good code is code that the next developer (including future me) can easily understand and modify.*
