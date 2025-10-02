import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Typography,
    Spin,
    Alert,
    Button,
    Form,
    InputNumber,
    Space,
    message,
    Tag,
    Progress
} from 'antd';
import {
    DesktopOutlined,
    DatabaseOutlined,
    HddOutlined,
    CloudServerOutlined,
    ReloadOutlined,
    SaveOutlined,
    WarningOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { resourceService, ResourceResponse, UpdateResourceRequest } from '../services/resourceService';
import { authService } from '../services/authService';

const { Title, Text } = Typography;

const Resources: React.FC = () => {
    const [resourceData, setResourceData] = useState<ResourceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [form] = Form.useForm();
    const [isAdmin, setIsAdmin] = useState(false);

    // Check if user is admin
    useEffect(() => {
        const user = authService.getCurrentUser();
        setIsAdmin(user?.role === 'admin');
    }, []);

    // Fetch resource data
    const fetchResourceData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await resourceService.getResources();
            setResourceData(data);

            // Set form values
            form.setFieldsValue({
                totalCpu: data.resource.totalCpu,
                totalRam: Math.round(data.resource.totalRam / 1024), // Convert MB to GB
                totalStorage: data.resource.totalStorage
            });
        } catch (err: any) {
            setError(err.message || 'Failed to fetch resource data');
            console.error('Fetch resource data error:', err);
        } finally {
            setLoading(false);
        }
    }, [form]);

    useEffect(() => {
        fetchResourceData();
    }, [fetchResourceData]);

    // Handle resource update
    const handleUpdateResource = async (values: UpdateResourceRequest) => {
        if (!isAdmin) {
            message.error('Only administrators can update resource settings');
            return;
        }

        setUpdateLoading(true);
        try {
            await resourceService.updateCurrentResource(values);
            message.success('Resource settings updated successfully');
            fetchResourceData(); // Refresh data
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Failed to update resource settings');
            console.error('Update resource error:', err);
        } finally {
            setUpdateLoading(false);
        }
    };

    // Get usage color
    const getUsageColor = (usage: number) => {
        if (usage >= 90) return '#ff4d4f';
        if (usage >= 75) return '#faad14';
        return '#52c41a';
    };

    // Get usage status
    const getUsageStatus = (usage: number) => {
        if (usage >= 90) return 'critical';
        if (usage >= 75) return 'warning';
        return 'normal';
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <p>Loading resource data...</p>
            </div>
        );
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    if (!resourceData) {
        return <Alert message="No Data" description="No resource data available." type="warning" showIcon />;
    }

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <Title level={2}>Resource Management</Title>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchResourceData}
                    loading={loading}
                >
                    Refresh
                </Button>
            </div>

            {/* Current Resource Status */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} lg={8}>
                    <Card>
                        <Statistic
                            title="Total CPU"
                            value={resourceData.resource.totalCpu}
                            suffix="cores"
                            prefix={<DesktopOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                        <Progress
                            percent={resourceData.usage.cpuUsage}
                            strokeColor={getUsageColor(resourceData.usage.cpuUsage)}
                            style={{ marginTop: '8px' }}
                        />
                        <Text type="secondary">
                            {resourceData.usage.cpuUsage}% used ({resourceData.usage.availableCpu} cores available)
                        </Text>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card>
                        <Statistic
                            title="Total RAM"
                            value={Math.round(resourceData.resource.totalRam / 1024)}
                            suffix="GB"
                            prefix={<DatabaseOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                        <Progress
                            percent={resourceData.usage.ramUsage}
                            strokeColor={getUsageColor(resourceData.usage.ramUsage)}
                            style={{ marginTop: '8px' }}
                        />
                        <Text type="secondary">
                            {resourceData.usage.ramUsage}% used ({Math.round(resourceData.usage.availableRam / 1024)} GB available)
                        </Text>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card>
                        <Statistic
                            title="Total Storage"
                            value={resourceData.resource.totalStorage}
                            suffix="GB"
                            prefix={<HddOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                        <Progress
                            percent={resourceData.usage.storageUsage}
                            strokeColor={getUsageColor(resourceData.usage.storageUsage)}
                            style={{ marginTop: '8px' }}
                        />
                        <Text type="secondary">
                            {resourceData.usage.storageUsage}% used ({resourceData.usage.availableStorage} GB available)
                        </Text>
                    </Card>
                </Col>
            </Row>

            {/* VPS Summary */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic
                            title="Total VPS"
                            value={resourceData.summary.totalVps}
                            prefix={<CloudServerOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic
                            title="Running VPS"
                            value={resourceData.summary.runningVps}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic
                            title="Stopped VPS"
                            value={resourceData.summary.stoppedVps}
                            prefix={<WarningOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic
                            title="Error VPS"
                            value={resourceData.summary.errorVps}
                            prefix={<WarningOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Resource Usage Alerts */}
            {(resourceData.usage.cpuUsage >= 75 || resourceData.usage.ramUsage >= 75 || resourceData.usage.storageUsage >= 75) && (
                <Alert
                    message="Resource Usage Alert"
                    description={
                        <div>
                            <p>High resource usage detected:</p>
                            <ul>
                                {resourceData.usage.cpuUsage >= 75 && (
                                    <li>CPU usage: {resourceData.usage.cpuUsage}%</li>
                                )}
                                {resourceData.usage.ramUsage >= 75 && (
                                    <li>RAM usage: {resourceData.usage.ramUsage}%</li>
                                )}
                                {resourceData.usage.storageUsage >= 75 && (
                                    <li>Storage usage: {resourceData.usage.storageUsage}%</li>
                                )}
                            </ul>
                        </div>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: '24px' }}
                />
            )}

            {/* Update Resource Settings (Admin Only) */}
            {isAdmin && (
                <Card title="Update Resource Settings" style={{ marginBottom: '24px' }}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdateResource}
                        style={{ maxWidth: '600px' }}
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="totalCpu"
                                    label="Total CPU Cores"
                                    rules={[
                                        { required: true, message: 'Please input total CPU cores!' },
                                        { type: 'number', min: 1, message: 'CPU cores must be at least 1!' }
                                    ]}
                                >
                                    <InputNumber
                                        min={1}
                                        max={128}
                                        style={{ width: '100%' }}
                                        placeholder="Enter total CPU cores"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="totalRam"
                                    label="Total RAM (GB)"
                                    rules={[
                                        { required: true, message: 'Please input total RAM!' },
                                        { type: 'number', min: 1, message: 'RAM must be at least 1 GB!' }
                                    ]}
                                >
                                    <InputNumber
                                        min={1}
                                        max={1024}
                                        style={{ width: '100%' }}
                                        placeholder="Enter total RAM in GB"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="totalStorage"
                                    label="Total Storage (GB)"
                                    rules={[
                                        { required: true, message: 'Please input total storage!' },
                                        { type: 'number', min: 1, message: 'Storage must be at least 1 GB!' }
                                    ]}
                                >
                                    <InputNumber
                                        min={1}
                                        max={10000}
                                        style={{ width: '100%' }}
                                        placeholder="Enter total storage in GB"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={updateLoading}
                                >
                                    Update Resources
                                </Button>
                                <Button onClick={() => form.resetFields()}>
                                    Reset
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            )}

            {/* Resource Information */}
            <Card title="Resource Information">
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                        <div>
                            <Text strong>Last Updated:</Text>
                            <br />
                            <Text>{new Date(resourceData.resource.lastUpdated).toLocaleString()}</Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={12}>
                        <div>
                            <Text strong>Resource Status:</Text>
                            <br />
                            <Space>
                                <Tag color={getUsageStatus(resourceData.usage.cpuUsage) === 'critical' ? 'red' :
                                    getUsageStatus(resourceData.usage.cpuUsage) === 'warning' ? 'orange' : 'green'}>
                                    CPU: {getUsageStatus(resourceData.usage.cpuUsage).toUpperCase()}
                                </Tag>
                                <Tag color={getUsageStatus(resourceData.usage.ramUsage) === 'critical' ? 'red' :
                                    getUsageStatus(resourceData.usage.ramUsage) === 'warning' ? 'orange' : 'green'}>
                                    RAM: {getUsageStatus(resourceData.usage.ramUsage).toUpperCase()}
                                </Tag>
                                <Tag color={getUsageStatus(resourceData.usage.storageUsage) === 'critical' ? 'red' :
                                    getUsageStatus(resourceData.usage.storageUsage) === 'warning' ? 'orange' : 'green'}>
                                    Storage: {getUsageStatus(resourceData.usage.storageUsage).toUpperCase()}
                                </Tag>
                            </Space>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default Resources;