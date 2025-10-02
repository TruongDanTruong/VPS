import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Space, Typography, Alert, Button, Input, Select, DatePicker, Row, Col, Statistic } from 'antd';
import {
    FileTextOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserOutlined,
    CloudServerOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { logService, Log, LogFilters } from '../services/logService';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Logs: React.FC = () => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filter states
    const [filters, setFilters] = useState<LogFilters>({});
    const [availableActions, setAvailableActions] = useState<string[]>([]);

    // Fetch logs
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await logService.getLogs({
                ...filters,
                page: currentPage,
                limit: pageSize
            });
            setLogs(response.logs);
            setTotal(response.total);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch logs');
            console.error('Fetch logs error:', err);
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage, pageSize]);

    // Fetch available actions
    const fetchActions = async () => {
        try {
            const actions = await logService.getLogActions();
            setAvailableActions(actions);
        } catch (err) {
            console.error('Fetch actions error:', err);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        fetchActions();
    }, []);

    // Handle filter changes
    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1);
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({});
        setCurrentPage(1);
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'green';
            case 'failed': return 'red';
            case 'pending': return 'blue';
            default: return 'default';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircleOutlined />;
            case 'failed': return <CloseCircleOutlined />;
            case 'pending': return <ClockCircleOutlined />;
            default: return <FileTextOutlined />;
        }
    };

    // Table columns
    const columns = [
        {
            title: 'Time',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleString(),
            sorter: (a: Log, b: Log) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (action: string) => (
                <Tag color="blue">{action}</Tag>
            ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'VPS',
            dataIndex: 'vpsName',
            key: 'vpsName',
            render: (vpsName: string, record: Log) => (
                vpsName ? (
                    <Space>
                        <CloudServerOutlined />
                        {vpsName}
                    </Space>
                ) : '-'
            ),
        },
        {
            title: 'User',
            dataIndex: 'userName',
            key: 'userName',
            render: (userName: string, record: Log) => (
                userName ? (
                    <Space>
                        <UserOutlined />
                        {userName}
                        {record.userEmail && (
                            <span style={{ color: '#666', fontSize: '12px' }}>
                                ({record.userEmail})
                            </span>
                        )}
                    </Space>
                ) : 'System'
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
    ];

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <div>
            <Title level={2}>System Logs</Title>

            {/* Statistics */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Total Logs"
                            value={total}
                            prefix={<FileTextOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Success Rate"
                            value={Math.round((logs.filter(log => log.status === 'success').length / logs.length) * 100) || 0}
                            suffix="%"
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Failed Actions"
                            value={logs.filter(log => log.status === 'failed').length}
                            prefix={<CloseCircleOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card title="Filters" style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Search by user"
                            value={filters.userId || ''}
                            onChange={(e) => handleFilterChange('userId', e.target.value || undefined)}
                            prefix={<UserOutlined />}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Search by VPS"
                            value={filters.vpsId || ''}
                            onChange={(e) => handleFilterChange('vpsId', e.target.value || undefined)}
                            prefix={<CloudServerOutlined />}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Filter by action"
                            value={filters.action || undefined}
                            onChange={(value) => handleFilterChange('action', value)}
                            style={{ width: '100%' }}
                            allowClear
                        >
                            {availableActions.map(action => (
                                <Option key={action} value={action}>{action}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Filter by status"
                            value={filters.status || undefined}
                            onChange={(value) => handleFilterChange('status', value)}
                            style={{ width: '100%' }}
                            allowClear
                        >
                            <Option value="success">Success</Option>
                            <Option value="failed">Failed</Option>
                            <Option value="pending">Pending</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <RangePicker
                            placeholder={['Start Date', 'End Date']}
                            onChange={(dates) => {
                                if (dates) {
                                    handleFilterChange('startDate', dates[0]?.format('YYYY-MM-DD'));
                                    handleFilterChange('endDate', dates[1]?.format('YYYY-MM-DD'));
                                } else {
                                    handleFilterChange('startDate', undefined);
                                    handleFilterChange('endDate', undefined);
                                }
                            }}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Space>
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={fetchLogs}
                            >
                                Search
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={clearFilters}
                            >
                                Clear
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Logs Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={logs}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} logs`,
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size || 10);
                        },
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>
        </div>
    );
};

export default Logs;