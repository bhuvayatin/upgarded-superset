import React, { useEffect, useState } from 'react';
import {
  Table,
  Switch,
  Space,
  notification,
  Popover,
  Modal,
  Tabs,
  Tooltip,
} from 'antd';
import { styled, SupersetClient, t } from '@superset-ui/core';
import { BsFileEarmarkSpreadsheetFill } from 'react-icons/bs';
import { IoDocumentText } from 'react-icons/io5';
import { FaPlus } from 'react-icons/fa';
import { ColumnsType } from 'antd/lib/table/interface';
import moment from 'moment';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Edit,
  Toolbar,
  Filter,
  Sort,
} from '@syncfusion/ej2-react-grids';
import Icons from 'src/components/Icons';
import Popup from './Popup';
// import Salesforce from '../../../assets/images/salesforce.png';
// import Surveymonkey from '../../../assets/images/surveymonkey.png';

const Outter = styled.div`
  display: flex;
  flex-direction: column;
`;
const Flex = styled.div`
  display: flex;
  max-width: 100%;
  justify-content: space-between;
  align-items: center;
  background: #fff;
`;
interface DataType {
  key: React.ReactNode;
  children?: DataType[];
}

// const rowSelection: TableRowSelection<any> = {
//   onChange: (selectedRowKeys, selectedRows) => {
//     console.log(
//       `selectedRowKeys: ${selectedRowKeys}`,
//       'selectedRows: ',
//       selectedRows,
//     );
//   },
//   onSelect: (record, selected, selectedRows) => {
//     console.log(record, selected, selectedRows);
//   },
//   onSelectAll: (selected, selectedRows, changeRows) => {
//     console.log(selected, selectedRows, changeRows);
//   },
// };

function Datasource() {
  const [modal2Visible, setModal2Visible] = useState(false);
  const [projectbyid, setProjectbyid] = useState<any>([]);
  const [dataid, setDataid] = useState('');
  const [source_type, setSource_type] = useState('');
  const [tableLoad, setTableLoad] = useState<any>(true);
  const [connection, setConnection] = useState<any>([]);
  const [tdata, SetTdata] = useState<any>('');
  const [activetab, Setactivetab] = useState<any>('1');
  const [tablename, SetTablename] = useState<any>('');

  const toolbarOptions: any = [
    'Add',
    'Edit',
    'Delete',
    'Update',
    'Cancel',
    'Search',
  ];
  const editSettings: any = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    newRowPosition: 'Top',
    mode: 'Batch',
  };

  const pageSettings: Object = { pageCount: 5, pageSize: 15 };
  const { TabPane } = Tabs;
  const filterSettings: any = { type: 'Menu' };
  // record update

  // Update Connection
  function sync_on(id: number, data: boolean) {
    SupersetClient.put({
      endpoint: `/api/v1/sync_db/${id}`,
      jsonPayload: {
        status: data ? 'inactive' : 'active',
      },
    })
      .then(response => {
        const endpoint = `/api/v1/sync_db/?q=(filters:!((col:project_id,opr:eq,value:${updateprojectid})))`;
        SupersetClient.get({ endpoint }).then(({ json }) => {
          const { result } = json;
          setConnection(result);
          setTableLoad(true);
        });
      })
      .catch(function (error) {
        notification.error({
          message: 'Sync not disable',
        });
      });
  }
  // Delete Google Sheet Connection
  function onChangesourceDelete(id: number) {
    Modal.confirm({
      icon: false,
      title:
        'Deleting the Source will delete all its data. Are you sure you want to delete it?',
      // content: 'Bla bla ...',
      onOk: () => {
        SupersetClient.delete({
          endpoint: `api/v1/sync_db/${id}`,
        }).then(response => {
          SupersetClient.get({
            endpoint: `/api/v1/sync_db/?q=(filters:!((col:project_id,opr:eq,value:${updateprojectid})))`,
          }).then(({ json }) => {
            const { result } = json;
            setConnection(result);
            setTableLoad(true);
          });
        });
      },
      okText: 'Ok',
      cancelText: 'Cancel',
      centered: true,
    });
  }

  // Delete NGConnection
  function onChangesourcengDelete(id: number) {
    Modal.confirm({
      icon: false,
      title:
        'Deleting the Source will delete all its data. Are you sure you want to delete it?',
      // content: 'Bla bla ...',
      onOk: () => {
        SupersetClient.delete({
          endpoint: `api/v1/ngconnection/${id}`,
        }).then(response => {
          SupersetClient.get({
            endpoint: `/api/v1/ngconnection/project/${updateprojectid}`,
          }).then(({ json }) => {
            const { result } = json;
            setConnection(result);
          });
        });
      },
      okText: 'Ok',
      cancelText: 'Cancel',
      centered: true,
    });
  }

  // Show Data in EJ2 Table
  function viewdata(id: any, type: String, name: String) {
    let slug: String = '';
    if (type === 'ngsurvey') {
      slug = 'ngconnection';
    } else if (type === 'google_sheet') {
      slug = 'sync';
    }
    const endpoint = `/api/v1/connection/${slug}/${id}/${name}`;
    SupersetClient.get({ endpoint })
      .then(({ json }) => {
        const { result } = json;
        SetTdata(result);
        Setactivetab('2');
        SetTablename(name);
      })
      .catch(function (error) {
        error.json().then(function (err: any) {
          Modal.error({
            icon: false,
            title: <div className="text-danger text-bold">{err.message}</div>,
            // content: 'Bla bla ...',
            onOk: () => {
              setModal2Visible(false);
            },
            okText: 'Ok',
            centered: true,
          });
        });
      });
  }

  const ejtabledata = tdata?.result;
  // Update EJ2 table data
  const beforeBatchSave = (args: any) => {
    if (args.cancel === false && tablename !== '') {
      SupersetClient.post({
        endpoint: `/api/v1/connection/${tdata?.type}/${updateprojectid}/${tdata?.connection_id}/${tablename}`,
        jsonPayload: {
          data: args?.batchChanges?.changedRecords,
        },
      })
        .then(response => {
          console.log(
            '🚀 ~ file: Datasource.tsx ~ line 89 ~ actionComplete ~ response',
            args,
          );
          Modal.success({
            icon: false,
            title: (
              <div className="text-sucess text-bold">
                Data Updated Successfully
              </div>
            ),
            // content: 'Bla bla ...',
            onOk: () => {
              setModal2Visible(false);
            },
            okText: 'Ok',
            centered: true,
          });
        })
        .catch(function (error) {
          error.json().then(function (err: any) {
            Modal.error({
              icon: false,
              title: <div className="text-danger text-bold">{err.message}</div>,
              // content: 'Bla bla ...',
              onOk: () => {
                setModal2Visible(false);
              },
              okText: 'Ok',
              centered: true,
            });
          });
        });
    }
  };

  // Format Date Function
  function formatDate(newDate: any) {
    const months = {
      0: 'January',
      1: 'February',
      2: 'March',
      3: 'April',
      4: 'May',
      5: 'June',
      6: 'July',
      7: 'August',
      8: 'September',
      9: 'October',
      10: 'November',
      11: 'December',
    };
    const d = newDate;
    const year = d.getFullYear();
    const date = d.getDate();
    const monthName = months[d.getMonth()];
    const formatted = ` ${date} ${monthName}, ${year}`;
    return formatted.toString();
  }

  // Open Popup
  const showPopUpHandler: any = (id: any, type: string) => {
    setModal2Visible(true);
    setDataid(id);
    setSource_type(type);
  };
  // Table Column
  const columns: ColumnsType<DataType> = [
    {
      title: 'Source Name',
      dataIndex: 'database_name',
      key: 'database_name',
      render: (text: any, record: any, index: any) => (
        <Space size="middle">
          {record.source_type === 'google_sheet' ? (
            <>
              <BsFileEarmarkSpreadsheetFill className="excel" />
              <div
                role="button"
                onClick={() =>
                  showPopUpHandler(record?.key, record?.source_type)
                }
                tabIndex={0}
              >
                <div>
                  <h5 className="tabledatatitle">{record?.database_name}</h5>
                  <p>{record?.source_name}</p>
                </div>
              </div>
            </>
          ) : record.source_type === 'ngsurvey' ? (
            <>
              <IoDocumentText className="excel" />
              <div
                role="button"
                onClick={() =>
                  showPopUpHandler(record?.key, record?.source_type)
                }
                tabIndex={0}
              >
                <div>
                  <h5 className="tabledatatitle">{record?.database_name}</h5>
                  <p>Sopact Survey</p>
                </div>
              </div>
            </>
          ) : (
            ''
          )}
        </Space>
      ),
      sorter: (a: any, b: any) =>
        a.database_name.localeCompare(b.database_name),
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (text: any, data: any, key: any) => (
        <Space size="middle">
          {data.source_type === 'google_sheet' ? (
            <div className="facircle">
              <p className="label">
                <i className="fa fa-circle" />{' '}
                {data.schedule == null ? 'manual' : `${data?.schedule} min`}
                {/* {data.schedule} min */}
              </p>
              <p className="sync">
                Last Sync:
                {data.last_sync_at
                  ? formatDate(new Date(data.last_sync_at))
                  : 'Not sync'}
              </p>
            </div>
          ) : data.source_type === 'ngsurvey' ? (
            <>
              <div className="facircle">
                <p className="label">
                  <i className="fa fa-circle" /> manual
                </p>
              </div>
            </>
          ) : (
            ''
          )}
        </Space>
      ),
      sorter: true,
    },
    {
      title: 'Last Sync',
      dataIndex: 'last_sync',
      key: 'last_sync',
      render: (text: any, data: any, key: any) => (
        <Space size="middle">
          {data.source_type === 'google_sheet' ? (
            <div className="facircle">
              <p className="label">
                <i className="fa fa-circle m-r-3" />
                {data.last_sync_at
                  ? `${moment().diff(moment(data.last_sync_at), 'days')} Days`
                  : 'Not Sync'}
              </p>
              <p className="sync">
                Last Sync:
                {data.last_sync_at
                  ? formatDate(new Date(data.last_sync_at))
                  : 'Not sync'}
              </p>
            </div>
          ) : data.source_type === 'ngsurvey' ? (
            <>
              <p>NA</p>
            </>
          ) : (
            ''
          )}
        </Space>
      ),
      sorter: true,
    },
    {
      title: 'Enabled',
      key: 'action',
      sorter: true,
      render: (text: any, data: any, key: any) => (
        <>
          {data.source_type === 'google_sheet' ? (
            <p>
              <Switch
                onChange={() => {
                  sync_on(data.key, data.sync_enabled);
                }}
                checked={data.sync_enabled}
              />
            </p>
          ) : data.source_type === 'ngsurvey' ? (
            <>
              <p>Yes</p>
            </>
          ) : (
            ''
          )}
        </>
      ),
    },
    {
      title: '',
      dataIndex: 'view',
      key: 'view',
      render: (text: any, data: any, key: any) => (
        <div className="flex items-center">
          {data.source_type === 'google_sheet' ? (
            <>
              <div className="action">
                <Tooltip
                  id="delete-action-tooltip"
                  title={t('Delete')}
                  placement="bottom"
                >
                  <span
                    role="button"
                    tabIndex={0}
                    className="action-button"
                    onClick={() => {
                      onChangesourceDelete(data.key);
                    }}
                  >
                    <Icons.Trash
                      data-test="dashboard-list-trash-icon"
                      style={{ marginRight: '16px' }}
                    />
                  </span>
                </Tooltip>
                <Tooltip
                  id="update-action-tooltip"
                  title={t('Edit')}
                  placement="bottom"
                >
                  <span
                    role="button"
                    tabIndex={0}
                    className="action-button"
                    onClick={() =>
                      showPopUpHandler(data.key, data?.source_type)
                    }
                  >
                    <Icons.EditAlt
                      data-test="update-action-tooltip"
                      style={{ marginRight: '16px' }}
                    />
                  </span>
                </Tooltip>
                <Popover
                  placement="bottomLeft"
                  content={
                    <>
                      <div>
                        {data?.table_name?.map((row: any) => (
                          <div
                            className="mb-0"
                            role="button"
                            onClick={() => {
                              viewdata(data.key, data?.source_type, row);
                            }}
                            tabIndex={0}
                          >
                            {row}
                          </div>
                        ))}
                      </div>
                    </>
                  }
                >
                  <Icons.Table data-test="edit-action-tooltip" />
                </Popover>
              </div>
            </>
          ) : data.source_type === 'ngsurvey' ? (
            <>
              <div className="action">
                <Tooltip
                  id="delete-action-tooltip"
                  title={t('Delete')}
                  placement="bottom"
                >
                  <span
                    role="button"
                    tabIndex={0}
                    className="action-button"
                    onClick={() => {
                      onChangesourcengDelete(data.key);
                    }}
                  >
                    <Icons.Trash
                      data-test="dashboard-list-trash-icon"
                      style={{ marginRight: '16px' }}
                    />
                  </span>
                </Tooltip>
                <Tooltip
                  id="update-action-tooltip"
                  title={t('Edit')}
                  placement="bottom"
                >
                  <span
                    role="button"
                    tabIndex={0}
                    className="action-button"
                    onClick={() =>
                      showPopUpHandler(data.key, data?.source_type)
                    }
                  >
                    <Icons.EditAlt
                      data-test="update-action-tooltip"
                      style={{ marginRight: '16px' }}
                    />
                  </span>
                </Tooltip>
                <Popover
                  placement="bottomLeft"
                  content={
                    <>
                      <div>
                        <div
                          className="mb-0"
                          role="button"
                          onClick={() => {
                            viewdata(
                              data.key,
                              data?.source_type,
                              data?.table_name,
                            );
                          }}
                          tabIndex={0}
                        >
                          {data?.table_name}
                        </div>
                      </div>
                    </>
                  }
                >
                  <Icons.Table data-test="edit-action-tooltip" />
                </Popover>
              </div>
            </>
          ) : (
            ''
          )}
        </div>
      ),
    },
  ];

  // Table Data

  const tableData = connection.map((row: any) => ({
    key: row?.id,
    database_name: row?.database_name,
    last_sync_at: row?.last_sync_at,
    source_name: row?.source_name,
    sync_enabled: row?.sync_enabled,
    source_type: row?.source_type,
    survey_id: row?.survey_id,
    schedule: row?.schedule?.units,
    table_name: row?.table_name,
  }));

  // Fro get Project details By ID
  const updateprojectid = localStorage.getItem('projectdetailid');

  // Get Project Data
  useEffect(() => {
    if (updateprojectid) {
      const endpoint = `/api/v1/project/${updateprojectid}`;
      SupersetClient.get({ endpoint }).then(({ json }) => {
        const { result } = json;
        setProjectbyid(result);
      });
    }
  }, []);

  // Get Sync Database
  // useEffect(() => {
  //   const endpoint = `/api/v1/sync_db/?q=(filters:!((col:project_id,opr:eq,value:${updateprojectid})))`;
  //   SupersetClient.get({ endpoint }).then(({ json }) => {
  //     const { result } = json;
  //     setConnection(result);
  //     setTableLoad(false);
  //   });
  // }, []);

  // Get the Connection Data
  useEffect(() => {
    SupersetClient.get({
      endpoint: `/api/v1/ngconnection/project/${updateprojectid}`,
    }).then(({ json }) => {
      const { result } = json;
      setConnection(result);
      setTableLoad(false);
    });
  }, []);

  // Set active tab
  const onChange = (key: string) => {
    Setactivetab(key);
  };

  const isTrue = true;
  // If change in connection refresh the table
  if (tableLoad) {
    const endpoint = `/api/v1/ngconnection/project/${updateprojectid}`;
    SupersetClient.get({ endpoint }).then(({ json }) => {
      const { result } = json;
      setConnection(result);
      setTableLoad(false);
    });
  }
  return (
    <>
      {modal2Visible === true ? (
        <Popup
          modal2Visible={modal2Visible}
          setModal2Visible={setModal2Visible}
          dataid={dataid}
          source_type={source_type}
          activedata="connection"
          setTableLoadfun={setTableLoad}
        />
      ) : null}
      <Flex>
        <div className="header">
          {updateprojectid ? projectbyid.name : 'Project Name'}
        </div>
        <button
          className="btn btn-blue m-r-10"
          type="button"
          onClick={() => {
            setModal2Visible(true);
            setDataid('');
            setSource_type('');
          }}
        >
          <FaPlus className="mxy-3" />
          NEW CONNECTION
        </button>
      </Flex>
      <Tabs activeKey={activetab} onChange={onChange}>
        <TabPane tab="Connections" key="1">
          <>
            <Outter id="datasource-table">
              <>
                <Table
                  className="projecttable"
                  // rowSelection={{ ...rowSelection }}
                  columns={columns}
                  dataSource={tableData}
                  // expandable={{
                  //   expandedRowRender: record => (
                  //     <p style={{ margin: 0 }}>{record.description}</p>
                  //   ),
                  //   expandIcon: ({ expanded, onExpand, record }) =>
                  //     expanded ? (
                  //       <UpCircleOutlined onClick={e => onExpand(record, e)} />
                  //     ) : (
                  //       <DownCircleOutlined onClick={e => onExpand(record, e)} />
                  //     ),
                  // }}
                  // expandIconColumnIndex={1}
                />
              </>
            </Outter>
          </>
        </TabPane>
        <TabPane tab="View Data" key="2">
          <>
            <div>
              {tdata !== '' ? (
                ejtabledata?.map((tdata: any, i: any) => (
                  <>
                    <div className="header">{tdata?.table_name}</div>
                    <GridComponent
                      dataSource={tdata?.data}
                      toolbar={toolbarOptions}
                      allowPaging
                      editSettings={editSettings}
                      pageSettings={pageSettings}
                      // actionBegin={recodeupdate}
                      beforeBatchSave={beforeBatchSave}
                      allowFiltering
                      filterSettings={filterSettings}
                      allowSorting
                    >
                      <ColumnsDirective>
                        {tdata?.columns?.map((item: any, i: any) => (
                          <ColumnDirective
                            field={item}
                            headerText={item}
                            width="200"
                            textAlign="Right"
                            visible={
                              item === '_airbyte_ab_id' ||
                              item === '_airbyte_emitted_at' ||
                              item === '_airbyte_normalized_at'
                                ? !isTrue
                                : isTrue
                            }
                            isPrimaryKey={
                              item === 'user_id' ||
                              item === `_airbyte_${tdata?.table_name}_hashid`
                            }
                          />
                        ))}
                      </ColumnsDirective>
                      <Inject services={[Page, Toolbar, Edit, Filter, Sort]} />
                    </GridComponent>
                  </>
                ))
              ) : (
                <h4 className="p-3">Please select data set.</h4>
              )}
            </div>
          </>
        </TabPane>
      </Tabs>
      {/* <table>
        {Object.keys(show).map((item: any) => (
          <tr key={item}>
            <td>{item}</td>
            <td>{show[item]}</td>
          </tr>
        ))}
      </table> */}
    </>
  );
}

export default Datasource;
