import React, { useEffect, useState } from 'react';
import {
  Modal,
  Button,
  Switch,
  Input,
  Radio,
  Table,
  notification,
  Space,
} from 'antd';
import { BsFileEarmarkSpreadsheetFill } from 'react-icons/bs';
import { ImArrowRight2 } from 'react-icons/im';
import { FiClock } from 'react-icons/fi';
import { IoSyncOutline } from 'react-icons/io5';
import Select from 'packages/superset-ui-chart-controls/src/components/Select';
import { TableRowSelection } from 'antd/lib/table/interface';
import { SupersetClient } from '@superset-ui/core';
import moment from 'moment';
import Sourcepopup from './Sourcepopup';

interface IProps {
  modal2Visible: boolean;
  setModal2Visible: (val: boolean) => void;
  dataid: number | any;
  activedata: string;
  setTableLoadfun: any;
  source_type: string;
}

const { Option } = Select;
// For Get Value search
const { Search } = Input;
const onSearch = (value: string) => console.log(value);
// For Table

const rowSelection: TableRowSelection<any> = {};
function Popup({
  modal2Visible,
  setModal2Visible,
  dataid,
  activedata,
  setTableLoadfun,
  source_type,
}: IProps) {
  const [value, setValue] = React.useState('all');
  const [active, setActive] = useState('connection');
  const [modalsourceVisible, setModalsourceVisible] = React.useState(false);
  const [getpopupdata, setPopupdata] = React.useState<any>([]);
  const [source_sync, setSource_sync] = React.useState<any>(5);
  const [sync_enabled, setSync_enabled] = React.useState<any>([]);
  const [synchistory, setSynchistory] = React.useState<any>([]);
  const [discover_schema, setDiscover_schema] = React.useState<any>([]);
  const [popupauth, setPopupauth] = useState('');
  const [namespace, setNamespace] = useState('source');
  const [customformat, setCustomformat] = useState(`\${SOURCE_NAMESPACE}`);
  const [prefixdata, setPrefixdata] = useState('');
  const [loadings, setLoadings] = React.useState(false);
  const [syncupdate, setSyncupdate] = React.useState<any>(true);
  const [datachange, setDatachange] = useState(false);
  const [withRefreshedCatalog, setWithRefreshedCatalog] = useState(false);
  const [isdesabled, setIsdesabled] = useState(false);
  // Get Data
  useEffect(() => {
    if (dataid) {
      const endpoint = `/api/v1/sync_db/${dataid}`;
      setSource_sync(null);
      setNamespace('');
      if (source_type === 'google_sheet') {
        SupersetClient.get({ endpoint }).then(({ json }) => {
          const { result } = json;
          setSync_enabled(result);
          setSyncupdate(result?.sync_enabled);
          setPrefixdata(result?.connection.prefix);
          setActive(activedata);
          setNamespace(result?.connection?.namespaceDefinition);
          setCustomformat(result?.connection?.namespaceFormat);
          if (result?.schedule === null) {
            setSource_sync(0);
          } else {
            setSource_sync(result?.schedule?.units);
          }
        });
      } else if (source_type === 'ngsurvey') {
        setIsdesabled(!isdesabled);
        const endpoint = `api/v1/ngconnection/${dataid}`;
        SupersetClient.get({ endpoint }).then(({ json }) => {
          const { result } = json;
          setSync_enabled(result);
          setSource_sync(0);
        });
      }
    }
  }, []);

  // Handle Custom Foramte Namespace
  // const handlecustomfield = (evt: any) => {
  //   setCustomformat(evt.target.value);
  // };

  // Handle prefix
  const handleprefix = (evt: any) => {
    if (dataid) {
      setDatachange(true);
    }
    setPrefixdata(evt.target.value);
  };

  const radioHandler = (event: any) => {
    setValue(event.target.value);
  };

  // Reload Window

  // Get Project Id from LoaclStorage
  const updateprojectid = localStorage.getItem('projectdetailid');

  // Call Post API
  function onsubmitconnection(e: any) {
    setLoadings(true);
    const payload =
      source_sync === 0
        ? null
        : {
            units: source_sync,
            timeUnit: 'minutes',
          };
    if (getpopupdata.sourcetype === 'Google Sheets') {
      SupersetClient.post({
        endpoint: `/api/v1/sync_db/`,
        jsonPayload: {
          database_name: getpopupdata.source_name,
          engine: 'postgresql',
          configuration_method: 'dynamic_form',
          paramProperties: {
            database: {
              description: 'Database name',
              type: 'string',
            },
            encryption: {
              description: 'Use an encrypted connection to the database',
              type: 'boolean',
            },
            host: {
              description: 'Hostname or IP address',
              type: 'string',
            },
            password: {
              description: 'Password',
              nullable: true,
              type: 'string',
            },
            port: {
              description: 'Database port',
              format: 'int32',
              maximum: 65536,
              minimum: 0,
              type: 'integer',
            },
            query: {
              additionalProperties: {},
              description: 'Additional parameters',
              type: 'object',
            },
            username: {
              description: 'Username',
              nullable: true,
              type: 'string',
            },
          },
          catalog: [
            {
              name: '',
              value: '',
            },
          ],
          parameters: {
            host: 'airbyte.superbyte',
            port: '5432',
            database: 'superset',
            username: 'superset',
            password: 'superset',
          },
          sync_params: {
            projectid: updateprojectid,
            namespaceDefinition: namespace,
            namespaceFormat: customformat,
            prefix: prefixdata,
            sourceDefinitionId: '71607ba1-c0ac-4799-8049-7f4b90dd50f7',
            spreadsheet_id: getpopupdata.sheetid,
            auth_code: popupauth,
            credentials: {
              auth_type: 'Client',
            },
            schedule: payload,
          },
        },
      })
        .then(response => {
          setModal2Visible(false);
          setLoadings(false);
          setTableLoadfun(true);
        })
        .catch(function (error) {
          error.json().then(function (err: any) {
            Modal.error({
              icon: false,
              title: (
                <div className="text-danger text-bold">
                  {/* {err.message.sync_params[0] !== '' ? err.message.sync_params[0] :err.message?.database_name} */}
                  {err.message.sync_params[0]}
                </div>
              ),
              // content: error.json().message.sync_params[0],
              onOk: () => {
                setModal2Visible(false);
              },
              okText: 'Ok',
              centered: true,
            });
          });
          setLoadings(false);
          setModal2Visible(false);
        });
    } else if (getpopupdata.sourcetype === 'NGSurvey') {
      SupersetClient.post({
        endpoint: `/api/v1/ngconnection/`,
        jsonPayload: {
          source_name: getpopupdata.source_name,
          survey_id: getpopupdata.ngsurveyid,
          project_id: updateprojectid,
          token: getpopupdata.ngauth,
        },
      })
        .then(response => {
          setModal2Visible(false);
          setLoadings(false);
          setTableLoadfun(true);
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
            setLoadings(false);
            setModal2Visible(false);
          });
        });
    }
    e.preventDefault();
  }

  function onupdateconnection() {
    if (dataid) {
      let payload = {};
      if (source_sync === 0) {
        payload = {
          prefix: prefixdata,
          schedule: null,
          namespaceDefinition: namespace,
          namespaceFormat: customformat,
          status: syncupdate ? 'active' : 'inactive',
          withRefreshedCatalog,
          syncCatalog: discover_schema,
        };
      } else {
        payload = {
          prefix: prefixdata,
          schedule: { units: source_sync, timeUnit: 'minutes' },
          namespaceDefinition: namespace,
          namespaceFormat: customformat,
          status: syncupdate ? 'active' : 'inactive',
          withRefreshedCatalog,
          syncCatalog: discover_schema,
        };
      }
      SupersetClient.put({
        endpoint: `/api/v1/sync_db/${dataid}`,
        jsonPayload: payload,
      })
        .then(response => {
          const endpoint = `/api/v1/sync_db/?q=(filters:!((col:project_id,opr:eq,value:${updateprojectid})))`;
          SupersetClient.get({ endpoint }).then(({ json }) => {
            const { result } = json;
            setSyncupdate(result[0].sync_enabled);
            if (result) {
              notification.success({
                message: 'Connection data updated',
              });
            }
          });
        })
        .catch(function (error) {
          notification.error({
            message: 'Connection data not updated',
          });
        });
    }
  }

  //  Get Discover Schema
  useEffect(() => {
    const endpoint = `/api/v1/sync_db/${dataid}/discover_schema`;
    if (dataid) {
      if (source_type === 'google_sheet') {
        SupersetClient.get({ endpoint }).then(({ json }) => {
          const { schema } = json;
          setDiscover_schema(schema);
        });
      }
    }
  }, []);

  function updatesourceschema() {
    if (source_type === 'google_sheet') {
      const endpoint = `/api/v1/sync_db/${dataid}/discover_schema?refresh=true`;
      SupersetClient.get({ endpoint }).then(({ json }) => {
        const { schema } = json;

        if (JSON.stringify(discover_schema) === JSON.stringify(schema)) {
          setWithRefreshedCatalog(false);
        } else {
          setDiscover_schema(schema);
          setWithRefreshedCatalog(true);
        }
      });
    }
  }

  // function updatesourceschema() {
  //   const endpoint = `/api/v1/sync_db/${dataid}/discover_schema`;
  //   SupersetClient.get({ endpoint }).then(({ json }) => {
  //     const { schema } = json;
  //   });
  // }

  // Get Sync History
  const getsynchistory = () => {
    setActive('status');
    const endpoint = `/api/v1/sync_db/${dataid}/sync_history`;
    if (dataid) {
      if (source_type === 'google_sheet') {
        SupersetClient.get({ endpoint }).then(({ json }) => {
          const { syncJobs } = json;
          setSynchistory(syncJobs);
        });
      }
    }
  };

  // Sync Now Handle
  function syncnowhandler(id: number) {
    if (dataid) {
      if (source_type === 'google_sheet') {
        SupersetClient.post({
          endpoint: `/api/v1/sync_db/${id}/sync`,
          jsonPayload: {},
        })
          .then(response => {
            const endpoint = `/api/v1/sync_db/${dataid}/sync_history`;

            SupersetClient.get({ endpoint }).then(({ json }) => {
              const { syncJobs } = json;
              setSynchistory(syncJobs);
              if (syncJobs) {
                notification.success({
                  message: 'Sync Successfully',
                });
              }
            });
          })
          .catch(function (error) {
            notification.error({
              message: 'Not Sync ',
            });
          });
      } else if (source_type === 'ngsurvey') {
        SupersetClient.post({
          endpoint: `/api/v1/ngconnection/${sync_enabled?.survey_id}/ngsync`,
          jsonPayload: {
            survey_id: sync_enabled?.survey_id,
            project_id: updateprojectid,
            token: sync_enabled?.token,
          },
        })
          .then(response => {
            notification.success({
              message: 'Sync Successfully',
            });
            setModal2Visible(false);
          })
          .catch(function (error) {
            notification.error({
              message: 'Not Sync',
            });
            setModal2Visible(false);
          });
      }
    }
  }

  // Reset Sync History
  function resetsynchandler(id: number) {
    if (dataid) {
      SupersetClient.post({
        endpoint: `/api/v1/sync_db/${id}/reset`,
        jsonPayload: {},
      })
        .then(response => {
          const endpoint = `/api/v1/sync_db/${dataid}/sync_history`;

          SupersetClient.get({ endpoint }).then(({ json }) => {
            const { syncJobs } = json;
            setSynchistory(syncJobs);
            if (syncJobs) {
              notification.success({
                message: 'Sync History Reset',
              });
            }
          });
        })
        .catch(function (error) {
          notification.error({
            message: 'Sync Not Reset ',
          });
        });
    }
  }

  // Sync Now Hanndle
  function sync_on(checked: boolean, data: boolean) {
    setSyncupdate(checked);
  }
  // Data for table Column
  const columns: any = [
    {
      title: 'Source Steam Name',
      dataIndex: 'source_name',
      render: (text: any, record: any, index: any) => (
        <Space size="middle">{record?.stream?.name}</Space>
      ),
    },
    {
      title: 'Source Name Space',
      dataIndex: 'source_namespace',
      render: (text: any, record: any, index: any) => (
        <Space size="middle">{record?.stream?.namespace}</Space>
      ),
    },
    {
      title: 'Sync Mode',
      dataIndex: 'sync_mode',
      render: (text: any, record: any, index: any) => (
        <Space size="middle">
          {record?.stream?.supportedSyncModes?.map((x: any, y: any) => (
            <div>{x}</div>
          ))}
        </Space>
      ),
    },
    {
      title: 'Primary Key',
      dataIndex: 'primary_key',
      render: (text: any, record: any, index: any) => (
        <Space size="middle">
          {record?.config?.primaryKey?.map((x: any, y: any) => (
            <div>{x}</div>
          ))}
        </Space>
      ),
    },
    {
      title: 'Cursor Field',
      dataIndex: 'cursor_field',
      render: (text: any, record: any, index: any) => (
        <Space size="middle">
          {record?.config?.cursorField?.map((x: any, y: any) => (
            <div>{x}</div>
          ))}
        </Space>
      ),
    },
  ];

  function oncanclehandler() {
    if (dataid && datachange) {
      Modal.confirm({
        icon: false,
        title: 'Please save first other wise your data may be lost',
        // content: 'Bla bla ...',
        onOk: () => {
          setModal2Visible(false);
        },
        okText: 'Ok',
        cancelText: 'Cancel',
        centered: true,
      });
    } else {
      setModal2Visible(false);
    }
  }

  // Popup Title
  const Title = (
    <div className="flex justify-between w-95 align-center">
      <div className="flex justify-center align-center">
        <h3 className="title">
          {dataid ? sync_enabled?.database_name : 'New Connection'}
        </h3>
        <button
          type="button"
          className={active === 'status' ? 'btn-blue status-btn' : 'status-btn'}
          onClick={getsynchistory}
        >
          Status
        </button>
        <button
          className={active === 'connection' ? 'btn-blue conn-btn' : 'conn-btn'}
          type="button"
          onClick={() => setActive('connection')}
        >
          Connection Settings
        </button>
      </div>
      <div className="flex right-pop-title">
        <p className="title">Enabled</p>
        <Switch
          onChange={(checked: boolean) => {
            //  console.log(`switch to ${checked}`);
            sync_on(checked, syncupdate);
            if (dataid) {
              setDatachange(true);
            }
          }}
          checked={syncupdate}
          disabled={isdesabled}
        />
      </div>
    </div>
  );

  return (
    <>
      <Sourcepopup
        modalsourceVisible={modalsourceVisible}
        setModalsourceVisible={setModalsourceVisible}
        getsourcepopupdata={setPopupdata}
        dataid={dataid}
        sync_enabled={sync_enabled}
        setPopupauth={setPopupauth}
        source_type={source_type}
      />
      <Modal
        title={Title}
        centered
        visible={modal2Visible}
        onCancel={oncanclehandler}
        width={1000}
        className="pop-up"
        footer={null}
      >
        <form
          style={{ display: active === 'connection' ? 'block' : 'none' }}
          onSubmit={dataid ? onupdateconnection : onsubmitconnection}
        >
          <div className="flex mb-3">
            <div className="sourc">
              <p>Source</p>
              {modal2Visible === true ? (
                <div
                  onClick={() => {
                    setModalsourceVisible(true);
                  }}
                  role="button"
                  tabIndex={0}
                  className="btn-source"
                >
                  <div className="flex items-center">
                    {getpopupdata.source_name ? (
                      <>
                        <BsFileEarmarkSpreadsheetFill className="excel-source m-r-10" />
                        {getpopupdata.source_name}
                      </>
                    ) : dataid ? (
                      <>
                        <BsFileEarmarkSpreadsheetFill className="excel-source m-r-10" />
                        {sync_enabled?.database_name}
                      </>
                    ) : (
                      'Select Source '
                    )}
                  </div>
                  <ImArrowRight2 />
                </div>
              ) : null}
            </div>
            <div className="sourc" style={{ marginLeft: '7%' }}>
              <p>Sync Frequency</p>
              {dataid.toString() !== '' ? (
                source_sync !== null ? (
                  <Select
                    defaultValue={
                      source_sync !== null ? source_sync.toString() : '5'
                    }
                    onChange={value => {
                      setSource_sync(parseInt(value, 10));
                      if (dataid) {
                        setDatachange(true);
                      }
                    }}
                    disabled={isdesabled}
                    className="select-sync"
                  >
                    <Option value="0">
                      <FiClock className="time" />
                      Manual
                    </Option>
                    <Option value="5">
                      <FiClock className="time" />
                      Every 5 minutes
                    </Option>
                    <Option value="15">
                      <FiClock className="time" />
                      Every 15 minutes
                    </Option>
                    <Option value="30">
                      <FiClock className="time" />
                      Every 30 minutes
                    </Option>
                  </Select>
                ) : null
              ) : (
                <Select
                  defaultValue="5"
                  className="select-sync"
                  onChange={value => {
                    setSource_sync(parseInt(value, 10));
                  }}
                >
                  <Option value="0">
                    <FiClock className="time" />
                    Manual
                  </Option>
                  <Option value="5">
                    <FiClock className="time" />
                    Every 5 minutes
                  </Option>
                  <Option value="15">
                    <FiClock className="time" />
                    Every 15 minutes
                  </Option>
                  <Option value="30">
                    <FiClock className="time" />
                    Every 30 minutes
                  </Option>
                </Select>
              )}
            </div>
          </div>
          <div>
            {/* <div className="mb-3">
              <p>
                <span>Namespace Configuration -</span>
                Define which namespace should be used in the destination.
              </p>

              {dataid.toString() !== '' ? (
                namespace !== '' ? (
                  (console.log(namespace),
                  (
                    <Select
                      defaultValue={namespace !== '' ? namespace : 'source'}
                      className="select-sync"
                      onChange={(value: any) => {
                        setNamespace(value);
                      }}
                    >
                      <Option value="source">Mirror Source Structure</Option>
                      <Option value="destination">Destination default</Option>
                      <Option value="customformat">Custom format</Option>
                    </Select>
                  ))
                ) : null
              ) : (
                <Select
                  defaultValue="source"
                  className="select-sync"
                  onChange={value => {
                    setNamespace(value);
                  }}
                >
                  <Option value="source">Mirror Source Structure</Option>
                  <Option value="destination">Destination default</Option>
                  <Option value="customformat">Custom format</Option>
                </Select>
              )}

              <div>
                {namespace === 'customformat' ? (
                  <Input
                    name="custom_format"
                    placeholder={`\${SOURCE_NAMESPACE}`}
                    className="my-3 prefix-input"
                    onChange={handlecustomfield}
                    // disabled={isdesabled}
                    value={dataid ? customformat : customformat}
                    required
                  />
                ) : null}
              </div>
            </div> */}
            <p style={{ width: '81%' }} className="mb-2">
              <span>Table Prefix -</span>Prefix to prefix all destination tables
              created as part of this connection. Useful for identifying tables
              on a pre-connection basis and namespacing streams from different
              sources so they do not overwrite each other.
            </p>
            <Input
              addonBefore="Prefix-"
              className="mb-3 prefix-input"
              onChange={handleprefix}
              value={dataid ? prefixdata : prefixdata}
              disabled={isdesabled}
            />
            <div className={dataid ? 'flex mb-3' : 'd-none'}>
              <p style={{ margin: 'auto 0' }}>
                <span>Select the data you want to sync</span>
              </p>
              <button
                className="btn-blue btn-update-sync flex align-center"
                type="button"
                onClick={updatesourceschema}
                disabled={isdesabled}
              >
                <IoSyncOutline className="sync-icon" />
                Update latest source schema
              </button>
            </div>
            <div className={dataid ? 'search-box-btn mb-2' : 'd-none'}>
              <Search
                placeholder="Search "
                onSearch={onSearch}
                style={{ width: 200, marginRight: '2%' }}
              />
              <Radio.Group name="radio" onChange={radioHandler} value={value}>
                <Radio value="all">All</Radio>
                <Radio value="selected">Selected</Radio>
                <Radio value="not-selected">Not Selected</Radio>
              </Radio.Group>
            </div>
          </div>
          {discover_schema?.streams?.length > 0 ? (
            <Table
              pagination={false}
              columns={columns}
              dataSource={discover_schema?.streams}
              rowSelection={rowSelection}
              // expandable={{
              //   expandedRowRender: record => (
              //     <p style={{ margin: 0 }}>{record.description}</p>
              //   ),
              //   expandIcon: ({ expanded, onExpand, record }) =>
              //     expanded ? (
              //       <DownOutlined onClick={e => onExpand(record, e)} />
              //     ) : (
              //       <RightOutlined onClick={e => onExpand(record, e)} />
              //     ),
              // }}
              className={dataid ? 'mb-2' : 'd-none'}
            />
          ) : null}
          {/* <p className="text-right">
            Showing {data.length} items out of {data.length} results found
          </p> */}
          <Button
            htmlType="submit"
            loading={loadings}
            className="btn-blue-popup m-r-10"
          >
            {dataid ? 'Save Changes' : 'Save'}
          </Button>
          <Button className="btn-white-popup" onClick={oncanclehandler}>
            Cancel
          </Button>
        </form>
        <div style={{ display: active === 'status' ? 'block' : 'none' }}>
          <div
            className="flex justify-between align-center w-100"
            style={{ background: '#E5E5E5', height: '50px', padding: '10px' }}
          >
            <div>Sync History</div>
            <div className="flex align-center">
              <button
                className="mx-3 btn-blue btn-update-sync flex align-center"
                type="button"
                style={{ width: '120px' }}
                onClick={() => syncnowhandler(dataid)}
              >
                <IoSyncOutline className="sync-icon" />
                Sync Now
              </button>
              <button
                type="button"
                className="flex align-center"
                style={{
                  width: '120px',
                  padding: '6px',
                  display: source_type === 'ngsurvey' ? 'none' : 'flex  ',
                }}
                onClick={() => resetsynchandler(dataid)}
              >
                <IoSyncOutline className="sync-icon" />
                Reset Data
              </button>
            </div>
          </div>
          <div style={{ height: '450px', overflowY: 'scroll' }}>
            <table style={{ width: '100%' }} className="statustable sync_table">
              <tbody>
                {synchistory?.map((syncdata: any) => (
                  <tr key={syncdata.job.id}>
                    <td>{syncdata.job.status}</td>
                    <td>
                      {syncdata.attempts[0]?.bytesSynced / 1024} KB |{' '}
                      {syncdata.attempts[0]?.recordsSynced} records |{' '}
                      {syncdata.attempts[0]?.endedAt -
                        syncdata.attempts[0]?.createdAt}
                      s | {syncdata?.job?.configType}
                    </td>
                    <td className="text-right">
                      {/* {moment
                        .unix(syncdata?.job?.updatedAt)
                        .format('hh:MM A DD/MMM/YYYY')} */}
                      {moment
                        .unix(syncdata?.job?.updatedAt)
                        .format('hh:mm A DD/MMM/YYYY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default Popup;
