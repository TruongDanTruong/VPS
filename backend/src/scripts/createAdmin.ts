import bcrypt from 'bcrypt';
import { User } from '../models';
import connectDB from '../config/database';

const createAdminUser = async () => {
    try {
        // Connect to database
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@vps.com' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        // Create admin user
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash('admin123', saltRounds);

        const adminUser = new User({
            username: 'admin',
            email: 'admin@vps.com',
            password: hashedPassword,
            role: 'admin'
        });

        await adminUser.save();

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@vps.com');
        console.log('🔑 Password: admin123');
        console.log('👤 Role: admin');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
};

createAdminUser();
