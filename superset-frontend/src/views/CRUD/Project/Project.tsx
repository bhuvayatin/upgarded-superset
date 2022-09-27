import React, { useEffect, useState } from 'react';
import { styled, SupersetClient, t } from '@superset-ui/core';
import { useHistory } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import { Modal, Table, Space, Tooltip, Select } from 'antd';
import moment from 'moment';
import Icons from 'src/components/Icons';
import AddProjectmodal from './AddProjectmodal';

const { Option } = Select;

const Outter1 = styled.div`
  max-width: 100%;
  display: flex;
  flex-direction: column;
`;
const Outter = styled.div`
  display: flex;
  margin: 0 0 16px;
  padding: 0;
  width: 100%;
  justify-content: space-between;
  align-items: baseline;
  height: auto;
  background: #fff;
`;
const Flex = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
`;
// const { Option } = Select;
// const Breadcum = styled.div``;
// const Title = styled.h2`
//   font-size: 20px;
//   font-weight: 700;
//   color: #353ea9;
// `;
// const Subtitle = styled.h5`
//   font-size: 14px;
//   font-weight: 700;
//   color: #353ea9;
// `;
// const Userimgoutter = styled.div`
//   position: relative;
//   width: 100%;
// `;
// const Whitebtn = styled.button`
//   background: #fff;
//   color: #000;
//   width: 100px;
//   height: 30px;
//   border: none;
//   border-radius: 5px;
// `;
// const Sprate = styled.div`
//   width: 1px;
//   height: 30px;
//   border-left: 1px solid #c7c7c7;
//   margin: 0 20px;
// `;
const Outtercard = styled.div`
  margin: 0 0;
  display: flex;
  flex-wrap: wrap;
`;
const Label = styled.label`
  text-transform: uppercase;
  font-size: 14px;
  color: #666666;
  margin-bottom: 4px;
  font-weight: 600;
`;
// const Card = styled.div`
//   box-shadow: 0px 0px 30px #7f89a14d;
//   width: 250px;
//   position: relative;
//   min-height: 428px;
//   height: 100%;
//   margin: 2%;
//   border-radius: 0 0 10px 10px;
//   cursor: pointer;
// `;
// const Uppercard = styled.div`
//   background: #353ea9;
//   min-height: 285px;
//   height: auto;
//   border-radius: 10px;
// `;
// const Lowercard = styled.div`
//   height: 100%;
//   border-radius: 0 0 10px 10px;
// `;

function Project() {
  const [project, setProject] = useState([]);
  const [addprojectmodal, setAddprojectmodal] = useState(false);
  const [tableLoad, setTableLoad] = React.useState<any>(true);

  const history = useHistory();

  const handleChange = (value: string) => {
    console.log(`selected ${value}`);
  };
  // For Get All The Project Data
  useEffect(() => {
    const endpoint = `/api/v1/connection/ngconnection/abd08f05-193e-4f56-8221-e61d32aa5f14`;
    SupersetClient.get({ endpoint }).then(({ json }) => {
      console.log(
        '🚀 ~ file: Project.tsx ~ line 111 ~ SupersetClient.get ~ json',
        json,
      );
    });
  }, []);

  useEffect(() => {
    setTableLoad(false);
    const endpoint = `/api/v1/project/`;
    SupersetClient.get({ endpoint }).then(({ json }) => {
      const { result } = json;
      setProject(result);
    });
  }, []);
  // For Pass The ID for updation
  const onChangeProjectIdHandler = (id: number) => {
    localStorage.setItem('projectdetailid', JSON.stringify(id));
    setAddprojectmodal(true);
  };
  const ViewProject = (id: number) => {
    localStorage.setItem('projectdetailid', JSON.stringify(id));
    history.push('/superset/datasource/');
  };
  // If We Create A New Project That Time We Need To Clear LocalStorage Value If Is Set
  const createproject = () => {
    localStorage.removeItem('projectdetailid');
    setAddprojectmodal(true);
    // history.push('/superset/datasource/');
  };
  // For Delete A Project
  const onChangeProjectIdDelete = (id: number) => {
    Modal.confirm({
      icon: false,
      title:
        'Deleting the project will delete all its data. Are you sure you want to delete it?',
      // content: 'Bla bla ...',
      onOk: () => {
        SupersetClient.delete({
          endpoint: `/api/v1/project/${id}`,
        }).then(response => {
          SupersetClient.get({ endpoint: `/api/v1/project/` }).then(
            ({ json }) => {
              const { result } = json;
              setProject(result);
              setTableLoad(true);
            },
          );
        });
      },
      okText: 'Ok',
      cancelText: 'Cancel',
      centered: true,
    });
  };
  // function formatDate(newDate: any) {
  //   const months = {
  //     0: 'January',
  //     1: 'February',
  //     2: 'March',
  //     3: 'April',
  //     4: 'May',
  //     5: 'June',
  //     6: 'July',
  //     7: 'August',
  //     8: 'September',
  //     9: 'October',
  //     10: 'November',
  //     11: 'December',
  //   };
  //   const d = newDate;
  //   const year = d.getFullYear();
  //   const date = d.getDate();
  //   const monthName = months[d.getMonth()];
  //   const formatted = ` ${date} ${monthName}, ${year}`;
  //   return formatted.toString();
  // }

  if (tableLoad) {
    const endpoint = `/api/v1/project/`;
    SupersetClient.get({ endpoint }).then(({ json }) => {
      const { result } = json;
      setProject(result);
      console.log(result);
      setTableLoad(false);
    });
  }
  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: any, record: any, index: any) => (
        <Space size="middle">
          <a
            onClick={() => {
              ViewProject(record.id);
            }}
            role="button"
            tabIndex={0}
          >
            {record.name}
          </a>
        </Space>
      ),
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Modified By',
      dataIndex: 'modified_by',
      render: (text: any, record: any, index: any) => (
        <Space size="middle">
          <p>{record.changed_by}</p>
        </Space>
      ),
      sorter: (a: any, b: any) => a.changed_by.localeCompare(b.changed_by),
    },
    {
      title: 'Connections',
      dataIndex: 'connection',
      key: 'connection',
      render: (text: any, record: any, index: any) => (
        <Space size="middle">{record.connection}</Space>
      ),
      sorter: (a: any, b: any) => a.connection - b.connection,
    },
    {
      title: 'Last Modified',
      dataIndex: 'modified',
      key: 'modified',
      render: (text: any, record: any, index: any) => (
        <Space size="middle">
          {moment().diff(moment(record.changed_on), 'days')}days ago
        </Space>
      ),
    },
    {
      title: 'Created By',
      dataIndex: 'created_by',
      render: (text: any, record: any, index: any) => (
        <Space size="middle">
          <p>{record.created_by}</p>
        </Space>
      ),
      sorter: (a: any, b: any) => a.created_by.localeCompare(b.created_by),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      render: (text: any, record: any, index: any) => (
        <Space size="middle" className="action">
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
                onChangeProjectIdDelete(record.id);
              }}
            >
              <Icons.Trash data-test="dashboard-list-trash-icon" />
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
              onClick={() => {
                onChangeProjectIdHandler(record.id);
              }}
            >
              <Icons.EditAlt data-test="update-action-tooltip" />
            </span>
          </Tooltip>
          <Tooltip
            id="edit-action-tooltip"
            title={t('Add Connections')}
            placement="bottom"
          >
            <span
              role="button"
              tabIndex={0}
              className="action-button"
              onClick={() => {
                ViewProject(record.id);
              }}
            >
              <Icons.Table data-test="edit-action-tooltip" />
            </span>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {addprojectmodal === true ? (
        <AddProjectmodal
          addprojectmodal={addprojectmodal}
          setAddprojectmodal={setAddprojectmodal}
          setTableLoadfun={setTableLoad}
        />
      ) : null}
      <Outter1>
        <Outter>
          <Flex>
            {/* <Userimgoutter>
              <img src={img} alt="img" className="usergrid user4" />
              <span className="usernum">1</span>
            </Userimgoutter>
            <Sprate /> */}
            <div className="header">Projects</div>
            <button
              onClick={createproject}
              className="btn btn-blue mx-3"
              type="button"
            >
              <FaPlus className="mxy-3" />
              Create Project
            </button>
          </Flex>
        </Outter>
        <Outtercard>
          <div className="w-100 flex gap p-3 pb-16">
            <div className="flex flex-column">
              <Label>project name</Label>
              <Select
                defaultValue=""
                style={{ width: 200 }}
                onChange={handleChange}
              >
                <Option value="">Project Name</Option>
                <Option value="jack">Jack</Option>
                <Option value="lucy">Lucy</Option>
                <Option value="Yiminghe">yiminghe</Option>
              </Select>
            </div>
            <div className="flex flex-column">
              <Label>CREATED BY</Label>
              <Select
                defaultValue=""
                style={{ width: 200 }}
                onChange={handleChange}
              >
                <Option value="">Created By</Option>
                <Option value="jack">Jack</Option>
                <Option value="lucy">Lucy</Option>
                <Option value="Yiminghe">yiminghe</Option>
              </Select>
            </div>
          </div>
          <Table
            dataSource={project}
            columns={columns}
            className="projecttable"
          />
        </Outtercard>
      </Outter1>
      {/* Model for Delete Confirmation */}
      {/* <Modal title="Basic Modal" visible={deletemodel} onOk={handleOk}>
        Are You Sure To Delete Project?
      </Modal> */}
    </>
  );
}

export default Project;
