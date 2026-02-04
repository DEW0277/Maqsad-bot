
const userService = require('./src/application/services/user.service');
const courseService = require('./src/application/services/course.service');
const progressService = require('./src/application/services/progress.service');

// Mock dependencies
const moduleRepo = require('./src/infrastructure/repositories/module.repo');
moduleRepo.findByCourseType = async (type) => [
    { _id: 'm1', title: 'Module 1', order: 1 },
    { _id: 'm2', title: 'Module 2', order: 2 },
    { _id: 'm3', title: 'Module 3', order: 3 }
];
progressService.getAvailableModules = async () => [{ _id: 'm1', title: 'Module 1', order: 1 }];

// Test 1: Multiple Admins Parsing
process.env.ADMIN_ID = "123, 456, 789";
const adminIds = userService.getAdminIds();
console.log('Admin IDs:', adminIds);
if (adminIds.length === 3 && adminIds.includes(123) && adminIds.includes(456)) {
    console.log('✅ Multiple Admin Parsing Passed');
} else {
    console.error('❌ Multiple Admin Parsing Failed');
}

// Test 2: Admin Access to All Modules
const adminUser = { telegramId: 456, _id: 'user_admin' };
courseService.getModulesForUser(adminUser, 'premium').then(modules => {
    console.log('Admin Modules Count:', modules.length);
    if (modules.length === 3) {
        console.log('✅ Admin Universal Access Passed');
    } else {
        console.error('❌ Admin Universal Access Failed (Expected 3, got ' + modules.length + ')');
    }
});

// Test 3: Regular User Access
const regularUser = { telegramId: 999, _id: 'user_regular' };
courseService.getModulesForUser(regularUser, 'premium').then(modules => {
    console.log('User Modules Count:', modules.length);
    if (modules.length === 1) {
        console.log('✅ Regular User Access Restriction Passed');
    } else {
        console.error('❌ Regular User Access Restriction Failed');
    }
});
