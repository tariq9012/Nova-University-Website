import {test} from 'node:test'
import assert from 'node:assert/strict'
import {PERMISSIONS,resolvePermissions,withImplied,isPermission} from '../lib/permissions'
test('catalogue contains the 18 required permissions',()=>{assert.equal(PERMISSIONS.length,18);assert.ok(isPermission('grades.manage'));assert.equal(isPermission('root'),false)})
test('manage implies view',()=>{assert.ok(withImplied(['cms.manage']).has('cms.view'))})
test('deny overrides role grants and allow overrides',()=>{const r=resolvePermissions(['finance.manage','users.view'],[{permissionKey:'finance.manage',effect:'deny'},{permissionKey:'finance.view',effect:'deny'},{permissionKey:'users.view',effect:'allow'}]);assert.equal(r.has('finance.manage'),false);assert.equal(r.has('finance.view'),false);assert.ok(r.has('users.view'))})
test('unknown permission keys are ignored and no grants means no access',()=>{assert.equal(resolvePermissions(['made.up'],[]).size,0);assert.equal(resolvePermissions([],[]).size,0)})
test('allow override can grant a permission the role lacks',()=>{assert.ok(resolvePermissions([],[{permissionKey:'audit.view',effect:'allow'}]).has('audit.view'))})
