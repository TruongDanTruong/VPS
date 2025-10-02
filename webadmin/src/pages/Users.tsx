import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    message,
    Popconfirm,
    Typography,
    Space,
    Card,
    Tag,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    MailOutlined,
    CrownOutlined
} from '@ant-design/icons';
import { userService, User, CreateUserRequest, UpdateUserRequest } from '../services/userService';

const { Title } = Typography;
const { Option } = Select;

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form] = Form.useForm();

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userService.getUsers();
            setUsers(response.users);
        } catch (error: any) {
            message.error('Failed to fetch users');
            console.error('Fetch users error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Handle create/edit user
    const handleSubmit = async (values: CreateUserRequest | UpdateUserRequest) => {
        try {
            if (editingUser) {
                // Update user
                await userService.updateUser(editingUser.id, values);
                message.success('User updated successfully');
            } else {
                // Create user
                await userService.createUser(values as CreateUserRequest);
                message.success('User created successfully');
            }

            setModalVisible(false);
            setEditingUser(null);
            form.resetFields();
            fetchUsers();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Operation failed');
            console.error('Submit error:', error);
        }
    };

    // Handle delete user
    const handleDelete = async (id: string) => {
        try {
            await userService.deleteUser(id);
            message.success('User deleted successfully');
            fetchUsers();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Delete failed');
            console.error('Delete error:', error);
        }
    };

    // Open modal for create
    const handleCreate = () => {
        setEditingUser(null);
        setModalVisible(true);
        form.resetFields();
    };

    // Open modal for edit
    const handleEdit = (user: User) => {
        setEditingUser(user);
        setModalVisible(true);
        form.setFieldsValue({
            username: user.username,
            email: user.email,
            role: user.role
        });
    };

    // Table columns
    const columns = [
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            render: (text: string) => (
                <Space>
                    <UserOutlined />
                    <strong>{text}</strong>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email: string) => (
                <Space>
                    <MailOutlined />
                    {email}
                </Space>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag
                    color={role === 'admin' ? 'red' : 'blue'}
                    icon={role === 'admin' ? <CrownOutlined /> : <UserOutlined />}
                >
                    {role.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: User) => (
                <Space>
                    <Tooltip title="Edit User">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Are you sure you want to delete this user?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete User">
                            <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <Title level={2} style={{ margin: 0 }}>Users Management</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                    >
                        Add User
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} users`,
                    }}
                />
            </Card>

            <Modal
                title={editingUser ? 'Edit User' : 'Add New User'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingUser(null);
                    form.resetFields();
                }}
                footer={null}
                width={500}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="username"
                        label="Username"
                        rules={[
                            { required: true, message: 'Please input username!' },
                            { min: 3, message: 'Username must be at least 3 characters!' },
                        ]}
                    >
                        <Input placeholder="Enter username" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please input email!' },
                            { type: 'email', message: 'Please enter a valid email!' },
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                { required: true, message: 'Please input password!' },
                                { min: 6, message: 'Password must be at least 6 characters!' },
                            ]}
                        >
                            <Input.Password placeholder="Enter password" />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Please select role!' }]}
                    >
                        <Select placeholder="Select role">
                            <Option value="user">User</Option>
                            <Option value="admin">Admin</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => {
                                setModalVisible(false);
                                setEditingUser(null);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingUser ? 'Update' : 'Create'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Users;
