import { USER_ROLE_PERMISSIONS } from '@/constants/users'

const clone = (value) => JSON.parse(JSON.stringify(value))

const resolvePermissions = (role) => USER_ROLE_PERMISSIONS[role] || USER_ROLE_PERMISSIONS['SALES AGENT']

export const usersService = {
  getInitialUsers() {
    return []
  },
  getPermissionsForRole(role) {
    return clone(resolvePermissions(role))
  },
}
