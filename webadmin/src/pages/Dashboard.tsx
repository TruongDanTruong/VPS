import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Alert } from 'antd';
import { UserOutlined, CloudServerOutlined, FileTextOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardService, DashboardStats } from '../services/dashboardService';
import { resourceService, ResourceResponse } from '../services/resourceService';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [resourceData, setResourceData] = useState<ResourceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch dashboard stats
                const statsData = await dashboardService.getStats();
                setStats(statsData);

                // Fetch resource data
                const resourceData = await resourceService.getResources();
                setResourceData(resourceData);

            } catch (err: any) {
                setError(err.message || 'Failed to fetch dashboard data');
                // Set default data if API fails
                setStats({
                    totalUsers: 1128,
                    totalVps: 93,
                    totalLogs: 1128,
                    totalResources: 93
                });
                setResourceData({
                    resource: {
                        id: '1',
                        totalCpu: 32,
                        totalRam: 32768,
                        totalStorage: 1024,
                        usedCpu: 8,
                        usedRam: 8192,
                        usedStorage: 256,
                        lastUpdated: new Date().toISOString()
                    },
                    usage: {
                        cpuUsage: 25,
                        ramUsage: 25,
                        storageUsage: 25,
                        availableCpu: 24,
                        availableRam: 24576,
                        availableStorage: 768
                    },
                    summary: {
                        totalVps: 93,
                        runningVps: 45,
                        stoppedVps: 30,
                        pausedVps: 15,
                        errorVps: 3
                    }
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div>
            <Title level={2}>Dashboard</Title>

            {error && (
                <Alert
                    message="API Connection Issue"
                    description={`Backend API not available. Showing mock data. Error: ${error}`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: '16px' }}
                />
            )}

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng Users"
                            value={stats?.totalUsers || 0}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng VPS"
                            value={resourceData?.summary.totalVps || 0}
                            prefix={<CloudServerOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="VPS Đang Chạy"
                            value={resourceData?.summary.runningVps || 0}
                            prefix={<PlayCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Logs Today"
                            value={stats?.totalLogs || 0}
                            prefix={<FileTextOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Resource Usage Charts */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card title="CPU Usage" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Used', value: resourceData?.usage.cpuUsage || 0, color: '#1890ff' },
                                        { name: 'Available', value: 100 - (resourceData?.usage.cpuUsage || 0), color: '#f0f0f0' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    {[
                                        { name: 'Used', value: resourceData?.usage.cpuUsage || 0, color: '#1890ff' },
                                        { name: 'Available', value: 100 - (resourceData?.usage.cpuUsage || 0), color: '#f0f0f0' }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            <Text strong>{resourceData?.usage.cpuUsage || 0}% Used</Text>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="RAM Usage" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Used', value: resourceData?.usage.ramUsage || 0, color: '#52c41a' },
                                        { name: 'Available', value: 100 - (resourceData?.usage.ramUsage || 0), color: '#f0f0f0' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    {[
                                        { name: 'Used', value: resourceData?.usage.ramUsage || 0, color: '#52c41a' },
                                        { name: 'Available', value: 100 - (resourceData?.usage.ramUsage || 0), color: '#f0f0f0' }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            <Text strong>{resourceData?.usage.ramUsage || 0}% Used</Text>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Storage Usage" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Used', value: resourceData?.usage.storageUsage || 0, color: '#fa8c16' },
                                        { name: 'Available', value: 100 - (resourceData?.usage.storageUsage || 0), color: '#f0f0f0' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    {[
                                        { name: 'Used', value: resourceData?.usage.storageUsage || 0, color: '#fa8c16' },
                                        { name: 'Available', value: 100 - (resourceData?.usage.storageUsage || 0), color: '#f0f0f0' }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            <Text strong>{resourceData?.usage.storageUsage || 0}% Used</Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* VPS Status Chart */}
            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col xs={24} lg={12}>
                    <Card title="VPS Status Distribution">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={[
                                { name: 'Running', value: resourceData?.summary.runningVps || 0, color: '#52c41a' },
                                { name: 'Stopped', value: resourceData?.summary.stoppedVps || 0, color: '#d9d9d9' },
                                { name: 'Paused', value: resourceData?.summary.pausedVps || 0, color: '#faad14' },
                                { name: 'Error', value: resourceData?.summary.errorVps || 0, color: '#ff4d4f' }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#1890ff" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Resource Summary">
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Statistic
                                    title="Total CPU"
                                    value={resourceData?.resource.totalCpu || 0}
                                    suffix="cores"
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Available CPU"
                                    value={resourceData?.usage.availableCpu || 0}
                                    suffix="cores"
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Total RAM"
                                    value={Math.round((resourceData?.resource.totalRam || 0) / 1024)}
                                    suffix="GB"
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Available RAM"
                                    value={Math.round((resourceData?.usage.availableRam || 0) / 1024)}
                                    suffix="GB"
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Total Storage"
                                    value={resourceData?.resource.totalStorage || 0}
                                    suffix="GB"
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Available Storage"
                                    value={resourceData?.usage.availableStorage || 0}
                                    suffix="GB"
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
