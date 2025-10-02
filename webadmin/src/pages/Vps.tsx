import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    message,
    Popconfirm,
    Typography,
    Space,
    Card,
    Tag,
    Tooltip,
    Row,
    Col,
    Statistic
} from 'antd';
import {
    PlusOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    ReloadOutlined,
    DeleteOutlined,
    CloudServerOutlined,
    EyeOutlined,
    DesktopOutlined,
    DatabaseOutlined,
    HddOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { vpsService, VpsInstance, CreateVpsRequest, UpdateVpsRequest } from '../services/vpsService';

const { Title } = Typography;
const { Option } = Select;

const Vps: React.FC = () => {
    const navigate = useNavigate();
    const [vpsList, setVpsList] = useState<VpsInstance[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingVps, setEditingVps] = useState<VpsInstance | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [form] = Form.useForm();

    // Fetch VPS list
    const fetchVpsList = async () => {
        setLoading(true);
        try {
            const response = await vpsService.getVpsList();
            setVpsList(response.vps);
        } catch (error: any) {
            message.error('Failed to fetch VPS list');
            console.error('Fetch VPS error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVpsList();
    }, []);

    // Handle create/edit VPS
    const handleSubmit = async (values: CreateVpsRequest | UpdateVpsRequest) => {
        try {
            if (editingVps) {
                // Update VPS
                await vpsService.updateVps(editingVps.id, values);
                message.success('VPS updated successfully');
            } else {
                // Create VPS
                await vpsService.createVps(values as CreateVpsRequest);
                message.success('VPS created successfully');
            }

            setModalVisible(false);
            setEditingVps(null);
            form.resetFields();
            fetchVpsList();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Operation failed');
            console.error('Submit error:', error);
        }
    };

    // Handle VPS actions
    const handleVpsAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
        setActionLoading(id);
        try {
            let result: VpsInstance;
            switch (action) {
                case 'start':
                    result = await vpsService.startVps(id);
                    message.success('VPS started successfully');
                    break;
                case 'stop':
                    result = await vpsService.stopVps(id);
                    message.success('VPS stopped successfully');
                    break;
                case 'restart':
                    result = await vpsService.restartVps(id);
                    message.success('VPS restarted successfully');
                    break;
                default:
                    return;
            }

            // Update the VPS in the list
            setVpsList(prev => prev.map(vps => vps.id === id ? result : vps));
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Action failed');
            console.error('VPS action error:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // Handle delete VPS
    const handleDelete = async (id: string) => {
        try {
            await vpsService.deleteVps(id);
            message.success('VPS deleted successfully');
            fetchVpsList();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Delete failed');
            console.error('Delete error:', error);
        }
    };

    // Open modal for create
    const handleCreate = () => {
        setEditingVps(null);
        setModalVisible(true);
        form.resetFields();
    };


    // Navigate to VPS detail
    const handleViewDetail = (id: string) => {
        navigate(`/vps/${id}`);
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'green';
            case 'stopped': return 'red';
            case 'paused': return 'orange';
            case 'error': return 'red';
            default: return 'default';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running': return <PlayCircleOutlined />;
            case 'stopped': return <PauseCircleOutlined />;
            case 'paused': return <PauseCircleOutlined />;
            case 'error': return <DeleteOutlined />;
            default: return <CloudServerOutlined />;
        }
    };

    // Table columns
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: VpsInstance) => (
                <Space>
                    <CloudServerOutlined />
                    <strong>{text}</strong>
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Resources',
            key: 'resources',
            render: (_: any, record: VpsInstance) => (
                <Space direction="vertical" size="small">
                    <Space>
                        <DesktopOutlined />
                        <span>{record.cpu} CPU</span>
                    </Space>
                    <Space>
                        <DatabaseOutlined />
                        <span>{record.ram}MB RAM</span>
                    </Space>
                    <Space>
                        <HddOutlined />
                        <span>{record.storage}GB Storage</span>
                    </Space>
                </Space>
            ),
        },
        {
            title: 'IP Address',
            dataIndex: 'ipAddress',
            key: 'ipAddress',
            render: (ip: string) => ip || 'Not assigned',
        },
        {
            title: 'OS',
            dataIndex: 'os',
            key: 'os',
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: VpsInstance) => (
                <Space wrap>
                    <Tooltip title="View Details">
                        <Button
                            type="default"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => handleViewDetail(record.id)}
                        />
                    </Tooltip>

                    {record.status === 'running' ? (
                        <Tooltip title="Stop VPS">
                            <Button
                                type="primary"
                                danger
                                icon={<PauseCircleOutlined />}
                                size="small"
                                loading={actionLoading === record.id}
                                onClick={() => handleVpsAction(record.id, 'stop')}
                            />
                        </Tooltip>
                    ) : (
                        <Tooltip title="Start VPS">
                            <Button
                                type="primary"
                                icon={<PlayCircleOutlined />}
                                size="small"
                                loading={actionLoading === record.id}
                                onClick={() => handleVpsAction(record.id, 'start')}
                            />
                        </Tooltip>
                    )}

                    <Tooltip title="Restart VPS">
                        <Button
                            type="default"
                            icon={<ReloadOutlined />}
                            size="small"
                            loading={actionLoading === record.id}
                            onClick={() => handleVpsAction(record.id, 'restart')}
                        />
                    </Tooltip>

                    <Popconfirm
                        title="Are you sure you want to delete this VPS?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete VPS">
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

    // Calculate statistics
    const totalVps = vpsList?.length || 0;
    const runningVps = vpsList?.filter(vps => vps.status === 'running').length || 0;
    const stoppedVps = vpsList?.filter(vps => vps.status === 'stopped').length || 0;

    return (
        <div>
            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Total VPS"
                            value={totalVps}
                            prefix={<CloudServerOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Running VPS"
                            value={runningVps}
                            prefix={<PlayCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Stopped VPS"
                            value={stoppedVps}
                            prefix={<PauseCircleOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <Title level={2} style={{ margin: 0 }}>VPS Management</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                    >
                        Create VPS
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={vpsList || []}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} VPS instances`,
                    }}
                />
            </Card>

            <Modal
                title={editingVps ? 'Edit VPS' : 'Create New VPS'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingVps(null);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="name"
                        label="VPS Name"
                        rules={[
                            { required: true, message: 'Please input VPS name!' },
                            { min: 3, message: 'Name must be at least 3 characters!' },
                        ]}
                    >
                        <Input placeholder="Enter VPS name" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="cpu"
                                label="CPU Cores"
                                rules={[
                                    { required: true, message: 'Please input CPU cores!' },
                                    { type: 'number', min: 1, max: 32, message: 'CPU must be between 1-32!' },
                                ]}
                            >
                                <InputNumber
                                    placeholder="CPU cores"
                                    min={1}
                                    max={32}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="ram"
                                label="RAM (MB)"
                                rules={[
                                    { required: true, message: 'Please input RAM!' },
                                    { type: 'number', min: 512, max: 32768, message: 'RAM must be between 512-32768MB!' },
                                ]}
                            >
                                <InputNumber
                                    placeholder="RAM in MB"
                                    min={512}
                                    max={32768}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="storage"
                                label="Storage (GB)"
                                rules={[
                                    { required: true, message: 'Please input storage!' },
                                    { type: 'number', min: 10, max: 1024, message: 'Storage must be between 10-1024GB!' },
                                ]}
                            >
                                <InputNumber
                                    placeholder="Storage in GB"
                                    min={10}
                                    max={1024}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="os"
                        label="Operating System"
                        rules={[{ required: true, message: 'Please select OS!' }]}
                    >
                        <Select placeholder="Select operating system">
                            <Option value="Ubuntu 20.04">Ubuntu 20.04</Option>
                            <Option value="Ubuntu 22.04">Ubuntu 22.04</Option>
                            <Option value="CentOS 7">CentOS 7</Option>
                            <Option value="CentOS 8">CentOS 8</Option>
                            <Option value="Debian 10">Debian 10</Option>
                            <Option value="Debian 11">Debian 11</Option>
                            <Option value="Windows Server 2019">Windows Server 2019</Option>
                            <Option value="Windows Server 2022">Windows Server 2022</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="ipAddress"
                        label="IP Address (Optional)"
                        rules={[
                            { pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, message: 'Please enter a valid IP address!' },
                        ]}
                    >
                        <Input placeholder="Enter IP address (optional)" />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => {
                                setModalVisible(false);
                                setEditingVps(null);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingVps ? 'Update' : 'Create'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Vps;
