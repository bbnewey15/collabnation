//The TaskModal displays a single tasks info
//Methods: Update field, delete task, 
//https://material-ui.com/components/modal/

import React, {useRef, useState, useEffect, useContext} from 'react';

import {makeStyles, Modal, Backdrop, Fade, Grid, TextField, FormControl, InputLabel, MenuItem, Select, 
    ButtonGroup, Button, CircularProgress, Avatar} from '@material-ui/core';

import SaveIcon from '@material-ui/icons/Save';
import TrashIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';

import cogoToast from 'cogo-toast';

import DateFnsUtils from '@date-io/date-fns';
import {
    DatePicker,
    TimePicker,
    DateTimePicker,
    MuiPickersUtilsProvider,
  } from '@material-ui/pickers';

import Util from '../../../js/Util.js';
import Tasks from '../../../js/Tasks';
import TaskList from '../../../js/TaskLists';

import TaskModalTaskInfo from './TaskModalSections/TaskModalTaskInfo';
import TaskModalAddressInfo from './TaskModalSections/TaskModalAddressInfo';
import TaskModalTaskList from './TaskModalSections/TaskModalTaskList';
import TaskModalWOSignArtItems from './TaskModalSections/TaskModalWOSignArtItems';

import { confirmAlert } from 'react-confirm-alert'; // Import
import ConfirmYesNo from '../../UI/ConfirmYesNo';
import { TaskContext } from '../TaskContainer.js';

//ALERT ////
// This component is in TaskContainer, TaskList, and MapContainer -
// Chang props to this component in both locations to prevent breaking 

export default function TaskModal(props){

    const {modalOpen, setModalOpen, modalTaskId, setModalTaskId} = props;
    const {taskLists, setTaskLists, setRows} = useContext(TaskContext);

    const classes = useStyles();

    const [modalTask, setModalTask] = React.useState(null); 
    const [shouldUpdate, setShouldUpdate] = React.useState(false);
    const [shouldReFetch, setShouldReFetch] = React.useState(false);

    const [editTaskInfo, setEditTaskInfo] = React.useState(false);
    const [editAddressInfo, setEditAddressInfo] = React.useState(false);
    
    

    const variables_to_update = {
        task_info: ["t_name", "description", "notes", "type", "hours_estimate", "date_assigned", "date_desired", "date_completed"],
        delivery_install: ["delivery_date", "delivery_crew", "delivery_order", "install_date", "install_crew", "install_order"],
        task:["task_status", "drilling", "artwork", "sign"]
    };
    
    const text_variables = ["t_name", "description", "notes",  "hours_estimate", "delivery_crew", "delivery_order" ,
      "install_crew", "install_order"];
    
    //Building an object of refs to update text input values instead of having them tied to state and updating every character
    const buildRefObject = arr => Object.assign({}, ...Array.from(arr, (k) => { return ({[k]: useRef(null)}) }));

    const [ref_object, setRef_Object] = React.useState(buildRefObject(text_variables));
    
    
    useEffect( () =>{ //useEffect for inputText
        //Gets data only on initial component mount
        if(modalTaskId) {
          Tasks.getTask(modalTaskId)
          .then( (data) => {
              setModalTask(data[0]);
              if(shouldReFetch){
                setShouldReFetch(false);
              }
             })
          .catch( error => {
            console.warn(JSON.stringify(error, null,2));
            cogoToast.error(`Error Getting task. ` + error, {hideAfter: 4});
          });
        }

      
        return () => { //clean up
            //Reset modalTask so that it properly updates the modal form with the correct modalTask
            setModalTask(null);
            setShouldUpdate(false);
            setEditTaskInfo(false);
            setEditAddressInfo(false);
        }
      },[ modalTaskId, shouldReFetch]);

    
    const handleOpenModal = () => {
        setModalOpen(true);
    };

    
    const handleClose = () => {
        setModalOpen(false);
        setModalTask(null);
        setModalTaskId(null);
    };

    const handleDelete = id => () => {

        const remove = () => {
            Tasks.removeTask(id)
                .then((ok)=>{
                    cogoToast.success(`Task ${id} has been deleted`, {hideAfter: 4})
                    handleClose();})
                .catch( error => {
                    console.warn(error);
                    cogoToast.error(`Error deleting task. ` + error, {hideAfter: 4});
            });
        }
        confirmAlert({
            customUI: ({onClose}) => {
                return(
                    <ConfirmYesNo onYes={remove} onClose={onClose} customMessage="Delete this task permanently?"/>
                );
            }
        })

    };

    const handleShouldUpdate = param => () => {
        setShouldUpdate(param);
        
    }

    const handleInputOnChange = (value, param, type, key) => {
        if(!value || !param || !type || !key){
            console.error("Bad handleInputOnChange call");
            return;
        }
        var tmpModalTask = {...modalTask};

        if(type === "datetime") {
            tmpModalTask[key] = Util.convertISODateTimeToMySqlDateTime(value.toISOString());

        }
        if(type === "select"){
            tmpModalTask[key] = value.target.value;
        }

        setModalTask(tmpModalTask);
        setShouldUpdate(param);
        
    }


    const handleSave = task => () => {
        if(!task || !task.t_id){
            return;
        }

        //TODO validate form
 
        if(shouldUpdate){
            var updateModalTask = {...task};

            //Create Object with our text input values using ref_object
            const objectMap = (obj, fn) =>
                Object.fromEntries(      Object.entries(obj).map( ([k, v], i) => [k, fn(v, k, i)]  )        );
            var textValueObject = objectMap(ref_object, v => v.current ? v.current.value ? v.current.value : null : null );

            //Adjusted Variables to Update, so that we can both: update one section at a time and/or update multiple
            var adj_variables_to_update = [ ...variables_to_update.task ];
            if(editTaskInfo) adj_variables_to_update = [...adj_variables_to_update, ...variables_to_update.task_info ];
            /*if(editDeliveryInstallInfo)*/ adj_variables_to_update = [...adj_variables_to_update, ...variables_to_update.delivery_install ];

            
            //Get only values we need to updateTask()
            for(var i =0 ; i< adj_variables_to_update.length; i++){
                const index = text_variables.indexOf(adj_variables_to_update[i]);
                //if key is not in text_variables, ie is a date or select input
                if(index === -1)
                    updateModalTask[adj_variables_to_update[i]] = task[adj_variables_to_update[i]];
                //if key is in text_variables, ie is a text input
                if(index >= 0){
                    updateModalTask[adj_variables_to_update[i]] = textValueObject[adj_variables_to_update[i]];
                }
                if(index === null){
                    console.error("index === null in handleSave");
                    cogoToast.error(`Internal Error`, {hideAfter: 4});
                }
            }
            //Add Id to this new object
            updateModalTask["t_id"] = task.t_id;
 
            Tasks.updateTask(updateModalTask)
            .then( (data) => {
                //Refetch our data on save
                cogoToast.success(`Task ${task.t_name} has been updated!`, {hideAfter: 4});
                setRows(null);
                setTaskLists(null);
            })
            .catch( error => {
              console.warn(error);
              cogoToast.error(`Error updating task. ` + error, {hideAfter: 4});
            })
        }
        //handleClose();
    };

    

    return(
        <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        className={classes.modal}
        open={modalOpen}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={modalOpen}>
            { modalTask ? /* If modalTask is not loaded, load the circularprogrss instead */
            <div className={classes.container}>
            <div className={classes.modalTitleDiv}>
                <span id="transition-modal-title" className={classes.modalTitle}>
                    Edit Task Id: {modalTask.t_id}&nbsp;&nbsp;&nbsp;Date Ordered: {modalTask.wo_date}
                </span>
            </div>
            <Grid container >  
                <Grid item xs={8} className={classes.paperScroll}>
                <hr className={classes.hr}/>
                
                <TaskModalTaskInfo  classes={classes} 
                                    modalTask={modalTask} 
                                    handleInputOnChange={handleInputOnChange} 
                                    handleShouldUpdate={handleShouldUpdate}
                                    handleSave={handleSave}
                                    ref_object={ref_object}
                                    editTaskInfo={editTaskInfo} setEditTaskInfo={setEditTaskInfo}/>

                <hr className={classes.hr}/>
                
                    
                <TaskModalAddressInfo  classes={classes} 
                                    modalTask={modalTask} 
                                    handleInputOnChange={handleInputOnChange} 
                                    handleShouldUpdate={handleShouldUpdate}
                                    handleSave={handleSave}
                                    ref_object={ref_object}
                                    editAddressInfo={editAddressInfo} setEditAddressInfo={setEditAddressInfo}/>
                    
                    <hr className={classes.hr}/>
                
                    
                <TaskModalWOSignArtItems taskId={modalTask.table_id}/>
                        
                </Grid>
                <Grid item xs={4} className={classes.paper}>
                    
                
                <p className={classes.taskTitle}>Drill / Sign / Artwork</p>
                <div>
                
                <Avatar src="/static/drilling-icon.png" className={classes.avatar}/>
                <FormControl variant="outlined" className={classes.inputField}>       
                    <InputLabel id="drilling-input-label">
                    Drilling
                    </InputLabel>
                    <Select
                    labelId="drilling-input-label"
                    id="drilling-input"
                    className={classes.selectBox}
                    value={modalTask.drilling}
                    onChange={value => handleInputOnChange(value, true, "select", "drilling")}
                    >
                    <MenuItem value={null}>N/A</MenuItem>
                    <MenuItem value={'Drill'}>Drill</MenuItem>
                    <MenuItem value={'Need Locate'}>Need Locate</MenuItem>
                    <MenuItem value={'Located'}>Located</MenuItem>
                    <MenuItem value={'Finished'}>Finished</MenuItem>  
                    </Select>
                </FormControl>
                </div>
                <div><Avatar src="/static/sign-build-icon.png" className={classes.avatar}/>
                <FormControl variant="outlined" className={classes.inputField}>
                    <InputLabel id="sign-input-label">
                    Sign
                    </InputLabel>
                    <Select
                    labelId="sign-input-label"
                    id="sign-input"
                    value={modalTask.sign}
                    onChange={value => handleInputOnChange(value, true, "select", "sign")}
                    >
                    <MenuItem value={null}>N/A</MenuItem>
                    <MenuItem value={'Build'}>Build</MenuItem>
                    <MenuItem value={'Finished'}>Finished</MenuItem>
                    </Select>
                </FormControl>
                </div>
                <div><Avatar src="/static/art-icon.png" className={classes.avatar}/>
                <FormControl variant="outlined" className={classes.inputField}>
                    <InputLabel id="artwork-input-label">
                    Artwork
                    </InputLabel>
                    <Select
                    labelId="artwork-input-label"
                    id="artwork-input"
                    value={modalTask.artwork}
                    onChange={value => handleInputOnChange(value, true, "select", "artwork")}
                    >
                    <MenuItem value={null}>N/A</MenuItem>
                    <MenuItem value={'Need Art'}>Need Art</MenuItem>
                    <MenuItem value={'Out for approval'}>Out for approval</MenuItem>
                    <MenuItem value={'Approved'}>Approved</MenuItem>
                    <MenuItem value={'Finished'}>Finished</MenuItem>
                    </Select>
                </FormControl>
                </div>
                <br/>
                <p className={classes.taskTitle}>Delivery/Install</p>
                <div>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}><DateTimePicker label="Install Date" className={classes.inputField} inputVariant="outlined"  value={modalTask.install_date} onChange={value => handleInputOnChange(value, true, "datetime", "install_date")} /></MuiPickersUtilsProvider>
                </div>
                <div>
                     <TextField className={classes.inputField} variant="outlined" id="input-install-crew" label="Install Crew" inputRef={ref_object.install_crew} defaultValue={modalTask.install_crew} onChange={handleShouldUpdate(true)}/>
                </div>

                
                { taskLists ?
                    <TaskModalTaskList taskLists={taskLists} setTaskLists={setTaskLists} 
                                        modalTask={modalTask}
                                        setShouldReFetch={setShouldReFetch}
                                        modalOpen={modalOpen} setModalOpen={setModalOpen} 
                                        setModalTaskId={setModalTaskId}/> 
                    :
                    <div>
                        <CircularProgress />
                    </div>
                }
                </Grid>
            </Grid>

            <Grid container >
                <Grid item xs={12} className={classes.paper_footer}>
                    <div className={classes.footerInputField}>
                        <FormControl variant="outlined" className={classes.inputField}>
                            <InputLabel id="status-input-label">
                            Task Status
                            </InputLabel>
                            <Select
                            labelId="status-input-label"
                            id="status-input"
                            value={modalTask.task_status}
                            onChange={value => handleInputOnChange(value, true, "select", "task_status")}
                            >
                            <MenuItem value={null}>N/A</MenuItem>
                            <MenuItem value={'Not Started'}>Not Started</MenuItem>
                            <MenuItem value={'In Progress'}>In Progress</MenuItem>
                            <MenuItem value={'Delivered'}>Delivered</MenuItem>
                            <MenuItem value={'Installed'}>Installed</MenuItem>
                            <MenuItem value={'Completed'}>Completed</MenuItem>  
                            </Select>
                        </FormControl>
                    </div>
                    <ButtonGroup className={classes.buttonGroup}>
                        <Button
                            onClick={handleDelete(modalTask.t_id)}
                            variant="contained"
                            color="secondary"
                            size="large"
                            className={classes.deleteButton}
                        ><TrashIcon />
                        </Button>
                        <Button
                            onClick={handleSave(modalTask)}
                            variant="contained"
                            color="primary"
                            size="large"
                            className={classes.saveButton}
                        >
                            <SaveIcon />Save
                        </Button>
                    </ButtonGroup>
                </Grid>
            </Grid>
            </div>
            : 
                <div>
                    <CircularProgress />
                </div>
            }   
        </Fade>
      </Modal>
    );
}

const useStyles = makeStyles(theme => ({
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1 !important',
      '&& div':{
          outline: 'none',
      },
    },
    paper: {
      backgroundColor: theme.palette.background.paper,
      boxShadow: theme.shadows[5],
      padding: '3% !important',
      position: 'relative',
      maxHeight: '600px'
    },
    paperScroll: {
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: '3% !important',
        position: 'relative',
        overflowY: 'auto',
        maxHeight: '600px',

        background: 'linear-gradient(white 30%, rgba(255, 255, 255, 0)), linear-gradient(rgba(255, 255, 255, 0), white 70%) 0 100%, radial-gradient(farthest-side at 50% 0, rgba(0, 0, 0, .2), rgba(0, 0, 0, 0)), radial-gradient(farthest-side at 50% 100%, rgba(0, 0, 0, .52), rgba(0, 0, 0, 0)) 0 100%',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 40px, 100% 40px, 100% 14px, 100% 14px',
        /* Opera doesn't support this in the shorthand */
        backgroundAttachment: 'local, local, scroll, scroll',
      },
    paper_footer: {
        backgroundColor: '#ececec',
        padding: '1% !important',
        display: 'flex',
        justifyContent:'flex-end',
    },
    container: {
        width: '60%',
        minHeight: '50%',
        textAlign: 'center',
        
    },
    modalTitleDiv:{
        backgroundColor: '#5b7087',
        padding: '5px 0px 5px 0px',
    },
    modalTitle: {
        fontSize: '18px',
        fontWeight: '300',
        color: '#fff',
    },
    taskTitle: {
        fontSize: '16px',
        fontWeight: '500',
        color: '#000',
        display: 'inline',
    },
    inputField: {
        margin: '10px 17px 7px 17px',
        padding: '0px',
        '&& input':{
            padding: '12px 0px 12px 15px',
        },
        '&& .MuiSelect-select':{
            padding: '12px 40px 12px 15px',
            minWidth: '120px',
        },
        '&& .MuiOutlinedInput-multiline': {
            padding: '8.5px 12px'
        },
        '&& label':{
            backgroundColor: '#fff',
        }
    },
    footerInputField: {

    },
    hr: {
        margin: '10px 0px 10px 0px',
        border: '2px solid #e1c179',
    },
    subsectionContainer:{
        padding: '2px 0px 2px 0px',
    },
    subsectionContainer_date:{
        backgroundColor: '#ebe63e4d',
    },
    lowerGrid: {
        textAlign: 'center',
    },
    lowerGridHead:{

    },
    text_head:{
        fontWeight: '600',
        fontVariant: 'small-caps',
        color: '#474747',
    },
    text_info:{
        fontWeight: '600',
        color: '#0083bf',
        fontSize: '12px',
    },
    text_info_grid:{
        padding: '4px 0px',
    },
    editFormButton: {
        padding: '0px 0px',
        marginLeft: '10px',
    },
    saveButton:{
        backgroundColor: '#414d5a'
    },
    deleteButton:{
        backgroundColor: '#b7c3cd'
    },
    buttonGroup: {
        
    },
    selectBox: {
        '&& .MuiInputLabel-outlined': {
            transform: 'translate(14px, 12px) scale(1)',
        }
    },
    avatar:{
        display: 'inline-block',
        width: '35px',
        height:'35px',
        position: 'relative',
        top: '11px',
        right: '5px',
    }
  }));