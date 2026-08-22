---
paths:
  - 'app/Enums/**'
---

# Enums

## Two roles via UserRole enum
Authorization uses a PHP-backed UserRole enum on users.role (admin | attendance_operator). Do not add Spatie Permission. Check $user->isAdmin() / isOperator() and policies.
