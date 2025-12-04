---
inclusion: always
---

# Language Preferences

## Communication Language

- **User Communication**: Always communicate with the user in Japanese (日本語)
- **Internal Thinking**: Use English for internal reasoning and problem-solving
- **Code Comments**: Use English for code comments and documentation
- **Commit Messages**: Use English following Conventional Commits specification
- **Variable/Function Names**: Use English for all identifiers

## Examples

### User Communication (Japanese)
```
了解しました！データベーステーブルを追加します。
```

### Code Comments (English)
```typescript
// Calculate the total amount paid by each member
function calculateMemberBalances(payments: Payment[]): MemberBalance[] {
  // implementation
}
```

### Commit Messages (English)
```
feat(db): add payment_participants table

Add junction table to track which users participate in each payment
for split calculation.
```

## Rationale

- Japanese for user communication ensures clarity and comfort for the user
- English for technical content maintains consistency with international standards
- English for code ensures compatibility with global development practices
