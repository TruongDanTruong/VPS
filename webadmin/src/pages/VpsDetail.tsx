import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Typography,
    Tag,
    Space,
    Button,
    Row,
    Col,
    Statistic,
    Descriptions,
    Spin,
    message,
    Tooltip,
    Tabs,
    Table,
    Modal,
    Form,
    Input,
    Popconfirm
} from 'antd';
import {
    ArrowLeftOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    ReloadOutlined,
    CloudServerOutlined,
    DesktopOutlined,
    DatabaseOutlined,
    HddOutlined,
    GlobalOutlined,
    CalendarOutlined,
    CameraOutlined,
    DeleteOutlined,
    PlusOutlined
} from '@ant-design/icons';
import { vpsService, VpsInstance } from '../services/vpsService';
import { snapshotService, Snapshot, CreateSnapshotRequest } from '../services/snapshotService';

const { Title, Text } = Typography;

const VpsDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [vps, setVps] = useState<VpsInstance | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Snapshots state
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [snapshotsLoading, setSnapshotsLoading] = useState(false);
    const [snapshotModalVisible, setSnapshotModalVisible] = useState(false);
    const [form] = Form.useForm();

    // Fetch VPS details
    const fetchVpsDetail = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        try {
            const vpsData = await vpsService.getVpsById(id);
            setVps(vpsData);
        } catch (error: any) {
            message.error('Failed to fetch VPS details');
            console.error('Fetch VPS detail error:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchVpsDetail();
    }, [id, fetchVpsDetail]);

    // Fetch snapshots
    const fetchSnapshots = async () => {
        if (!id) return;

        setSnapshotsLoading(true);
        try {
            const response = await snapshotService.getVpsSnapshots(id);
            setSnapshots(response.snapshots);
        } catch (error: any) {
            message.error('Failed to fetch snapshots');
            console.error('Fetch snapshots error:', error);
        } finally {
            setSnapshotsLoading(false);
        }
    };

    // Create snapshot
    const handleCreateSnapshot = async (values: CreateSnapshotRequest) => {
        if (!id) return;

        try {
            await snapshotService.createSnapshot(id, values);
            message.success('Snapshot created successfully');
            setSnapshotModalVisible(false);
            form.resetFields();
            fetchSnapshots();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to create snapshot');
            console.error('Create snapshot error:', error);
        }
    };

    // Delete snapshot
    const handleDeleteSnapshot = async (snapshotId: string) => {
        try {
            await snapshotService.deleteSnapshot(snapshotId);
            message.success('Snapshot deleted successfully');
            fetchSnapshots();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to delete snapshot');
            console.error('Delete snapshot error:', error);
        }
    };

    // Handle VPS actions
    const handleVpsAction = async (action: 'start' | 'stop' | 'restart') => {
        if (!id) return;

        setActionLoading(true);
        try {
            let result;
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
            }

            setVps(result);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Action failed');
            console.error('VPS action error:', error);
        } finally {
            setActionLoading(false);
        }
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
            case 'error': return <PauseCircleOutlined />;
            default: return <CloudServerOutlined />;
        }
    };

    // Get snapshot status color
    const getSnapshotStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'creating': return 'blue';
            case 'failed': return 'red';
            case 'deleting': return 'orange';
            default: return 'default';
        }
    };

    // Snapshot table columns
    const snapshotColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <Space>
                    <CameraOutlined />
                    <strong>{text}</strong>
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getSnapshotStatusColor(status)}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Size',
            dataIndex: 'size',
            key: 'size',
            render: (size: number) => `${(size / 1024).toFixed(2)} GB`,
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Snapshot) => (
                <Space>
                    <Popconfirm
                        title="Are you sure you want to delete this snapshot?"
                        onConfirm={() => handleDeleteSnapshot(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete Snapshot">
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

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <p>Loading VPS details...</p>
            </div>
        );
    }

    if (!vps) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Title level={3}>VPS not found</Title>
                <Button onClick={() => navigate('/vps')}>
                    Back to VPS List
                </Button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/vps')}
                    style={{ marginBottom: '16px' }}
                >
                    Back to VPS List
                </Button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <CloudServerOutlined /> {vps.name}
                        </Title>
                        <Tag
                            color={getStatusColor(vps.status)}
                            icon={getStatusIcon(vps.status)}
                            style={{ marginTop: '8px' }}
                        >
                            {vps.status.toUpperCase()}
                        </Tag>
                    </div>

                    <Space>
                        {vps.status === 'running' ? (
                            <Tooltip title="Stop VPS">
                                <Button
                                    type="primary"
                                    danger
                                    icon={<PauseCircleOutlined />}
                                    loading={actionLoading}
                                    onClick={() => handleVpsAction('stop')}
                                >
                                    Stop
                                </Button>
                            </Tooltip>
                        ) : (
                            <Tooltip title="Start VPS">
                                <Button
                                    type="primary"
                                    icon={<PlayCircleOutlined />}
                                    loading={actionLoading}
                                    onClick={() => handleVpsAction('start')}
                                >
                                    Start
                                </Button>
                            </Tooltip>
                        )}

                        <Tooltip title="Restart VPS">
                            <Button
                                icon={<ReloadOutlined />}
                                loading={actionLoading}
                                onClick={() => handleVpsAction('restart')}
                            >
                                Restart
                            </Button>
                        </Tooltip>
                    </Space>
                </div>
            </div>

            {/* Statistics */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="CPU Cores"
                            value={vps.cpu}
                            prefix={<DesktopOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="RAM"
                            value={vps.ram}
                            suffix="MB"
                            prefix={<DatabaseOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Storage"
                            value={vps.storage}
                            suffix="GB"
                            prefix={<HddOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Tabs */}
            <Tabs
                defaultActiveKey="overview"
                items={[
                    {
                        key: 'overview',
                        label: 'Overview',
                        children: (
                            <Row gutter={[16, 16]}>
                                <Col xs={24} lg={12}>
                                    <Card title="VPS Information">
                                        <Descriptions column={1} bordered>
                                            <Descriptions.Item label="Name">
                                                <Text strong>{vps.name}</Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Status">
                                                <Tag color={getStatusColor(vps.status)} icon={getStatusIcon(vps.status)}>
                                                    {vps.status.toUpperCase()}
                                                </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="IP Address">
                                                <Space>
                                                    <GlobalOutlined />
                                                    {vps.ipAddress || 'Not assigned'}
                                                </Space>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Operating System">
                                                {vps.os}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Created At">
                                                <Space>
                                                    <CalendarOutlined />
                                                    {new Date(vps.createdAt).toLocaleString()}
                                                </Space>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Last Updated">
                                                <Space>
                                                    <CalendarOutlined />
                                                    {new Date(vps.updatedAt).toLocaleString()}
                                                </Space>
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Card>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <Card title="Resource Usage">
                                        <Row gutter={[16, 16]}>
                                            <Col span={12}>
                                                <Statistic
                                                    title="CPU Usage"
                                                    value={0}
                                                    suffix="%"
                                                    valueStyle={{ color: '#1890ff' }}
                                                />
                                            </Col>
                                            <Col span={12}>
                                                <Statistic
                                                    title="RAM Usage"
                                                    value={0}
                                                    suffix="%"
                                                    valueStyle={{ color: '#52c41a' }}
                                                />
                                            </Col>
                                            <Col span={12}>
                                                <Statistic
                                                    title="Storage Usage"
                                                    value={0}
                                                    suffix="%"
                                                    valueStyle={{ color: '#fa8c16' }}
                                                />
                                            </Col>
                                            <Col span={12}>
                                                <Statistic
                                                    title="Network Usage"
                                                    value={0}
                                                    suffix="Mbps"
                                                    valueStyle={{ color: '#722ed1' }}
                                                />
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            </Row>
                        ),
                    },
                    {
                        key: 'snapshots',
                        label: 'Snapshots',
                        children: (
                            <Card>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '16px'
                                }}>
                                    <Title level={4} style={{ margin: 0 }}>
                                        <CameraOutlined /> Snapshots
                                    </Title>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setSnapshotModalVisible(true)}
                                    >
                                        Create Snapshot
                                    </Button>
                                </div>

                                <Table
                                    columns={snapshotColumns}
                                    dataSource={snapshots || []}
                                    rowKey="id"
                                    loading={snapshotsLoading}
                                    pagination={{
                                        pageSize: 10,
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        showTotal: (total, range) =>
                                            `${range[0]}-${range[1]} of ${total} snapshots`,
                                    }}
                                />
                            </Card>
                        ),
                    },
                ]}
                onChange={(key) => {
                    if (key === 'snapshots') {
                        fetchSnapshots();
                    }
                }}
            />

            {/* Create Snapshot Modal */}
            <Modal
                title="Create Snapshot"
                open={snapshotModalVisible}
                onCancel={() => {
                    setSnapshotModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={500}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateSnapshot}
                >
                    <Form.Item
                        name="name"
                        label="Snapshot Name"
                        rules={[
                            { required: true, message: 'Please input snapshot name!' },
                            { min: 3, message: 'Name must be at least 3 characters!' },
                        ]}
                    >
                        <Input placeholder="Enter snapshot name" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description (Optional)"
                    >
                        <Input.TextArea
                            placeholder="Enter snapshot description"
                            rows={3}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => {
                                setSnapshotModalVisible(false);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Create Snapshot
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default VpsDetail;
