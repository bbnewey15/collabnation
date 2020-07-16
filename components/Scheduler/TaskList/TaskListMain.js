import React, {useRef, useState, useEffect, useContext} from 'react';
import {makeStyles, Paper,IconButton,ListItemSecondaryAction, ListItem, ListItemText, FormControlLabel, Switch,Grid, List } from '@material-ui/core';

import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';

import CircularProgress from '@material-ui/core/CircularProgress';
import TaskListTasks from './TaskListTasks';
import TaskListToolbar from './TaskListToolbar';
import TaskListSidebar from './TaskListSidebar';
import { confirmAlert } from 'react-confirm-alert'; // Import
import ConfirmYesNo from '../../UI/ConfirmYesNo';
import NoSsr from '../../UI/NoSsr';
import dynamic from 'next/dynamic'

import TaskLists from '../../../js/TaskLists';
import {createSorter} from '../../../js/Sort';
import {createFilter} from '../../../js/Filter';
import cogoToast from 'cogo-toast';

import {TaskContext} from '../TaskContainer';
import TaskListFilter from './TaskListFilter';

const KeyBinding = dynamic(()=> import('react-keybinding-component'), {
    ssr: false
  });

const TaskListMain = (props) => {
    //STATE
    const [taskListTasks, setTaskListTasks] = React.useState(null);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [table_info ,setTableInfo] = useState(null);
    
    const [sorterState, setSorterState] = useState(0);

    
    //PROPS
    const { openTaskList, setOpenTaskList,isPriorityOpen, setIsPriorityOpen} = props;

    const {taskLists, setTaskLists, tabValue, setTabValue,
        taskListToMap, setTaskListToMap,setModalTaskId, 
        modalOpen, setModalOpen, priorityList, setPriorityList, setSelectedIds, 
        setMapRows,filters, setFilters,filterInOrOut, setFilterInOrOut,
         sorters, setSorters,
         taskListTasksSaved, setTaskListTasksSaved} = useContext(TaskContext);


    //CSS
    const classes = useStyles({sorterState, sorters});

    useEffect( () =>{ //useEffect for inputText
        //Gets data only on initial component mount
        if(taskLists == null){
            setTaskListTasks(null);
        }
        if(taskLists && openTaskList && openTaskList.id && taskListTasks == null ) { 
            TaskLists.getTaskList(openTaskList.id)
            .then( (data) => {
                if(!Array.isArray(data)){
                    console.error("Bad tasklist data",data);
                    return;
                }
                var tmpData = [...data];
                
                //filter on data
                if(filters && filters.length > 0){
                    tmpData = tmpData.filter(createFilter([...filters], filterInOrOut))
                    //Set saved for filter list 
                    setTaskListTasksSaved(data);
                }
                //sort
                if(sorters && sorters.length > 0){
                    tmpData = tmpData.sort(createSorter(...sorters))
                    //Set saved for filter list 
                    setTaskListTasksSaved(data);
                }
                //No filters or sorters
                if(filters && !filters.length && sorters && !sorters.length){
                    //no change to tmpData
                    setTaskListTasksSaved(data);
                }

                //Set TaskListTasks
                if(Array.isArray(tmpData)){
                    setTaskListTasks(tmpData);
                }
                
            })
            .catch( error => {
                cogoToast.error(`Error getting Task List`, {hideAfter: 4});
                console.warn(JSON.stringify(error, null,2));
            })
        }
    return () => { //clean up
        if(taskLists){
        }
    }
    },[openTaskList,taskListTasks, taskLists]);


    //Sort
    useEffect(()=>{
        if (Array.isArray(sorters) && sorters.length) {
            if (taskListTasks && taskListTasks.length) {
                var tmpData = taskListTasks.sort(createSorter(...sorters))
                console.log(tmpData);
                var copyObject = [...tmpData];
                setTaskListTasks(copyObject);
                cogoToast.success(`Sorting by ${sorters.map((v, i)=> v.property + ", ")}`);
            }
        }
    },[sorters])
    
    //table_info ie head items
    useEffect(()=>{
        if(table_info == null){
            setTableInfo([
                {text: "WO #", field: "table_id", width: '7%', type: 'number'},
                {text: "Desired Date", field: "date_desired", width: '10%', style: 'boldListItemText', type: 'date'},
                {text: "1st Game", field: "first_game", width: '10%', type: 'date'},
                {text: "install_date", field: "install_date", width: '10%', type: 'date'},
                {text: "Name", field: "t_name", width: '20%', style: 'boldListItemText', type: 'text'},
                {text: "Type", field: "type", width: '8%', type: 'text'},
                {text: "Description", field: "description", width: '19%', style: 'smallListItemText', type: 'text'},
                {text: "Drill Status", field: "drilling", width: '8%', type: 'text'},
                {text: "Task Status", field: "completed_wo", width: '8%', type: 'number'}
            ])
        }
    },[table_info])

    const handleChangeTaskView = (view)=>{
        if(!view){
            setTableInfo(null);
        }
        var viewArray =[];
        switch(view){
            case "date":
                viewArray = [
                    {text: "Desired Date", field: "date_desired", width: '9%', style: 'boldListItemText', type: 'date'},
                    {text: "1st Game", field: "first_game", width: '9%', type: 'date'},
                    {text: "install_date", field: "install_date", width: '9%', type: 'date'},
                    {text: "drill_date", field: "drill_date", width: '9%', type: 'date'},
                    {text: "Name", field: "t_name", width: '48%', style: 'boldListItemText', type: 'text'},
                    {text: "Type", field: "type", width: '8%', type: 'text'},
                    {text: "Task Status", field: "completed_wo", width: '8%', type: 'number'}
                ];
                break;
            case "compact":
                viewArray = [
                    {text: "Order", field: "priority_order", width: '4%',style: 'smallListItemText', type: 'number'},
                    {text: "WO #", field: "table_id", width: '4%',style: 'smallListItemText', type: 'number'},
                    {text: "Desired Date", field: "date_desired", width: '7%', style: 'smallListItemText', type: 'date'},
                    {text: "Date Entered", field: "tl_date_entered", width: '6%', style: 'smallListItemText', type: 'date'},
                    {text: "1st Game", field: "first_game", width: '6%', type: 'date'},
                    {text: "Name", field: "t_name", width: '12%', style: 'boldListItemText', type: 'text'},
                    {text: "State", field: "state", width: '4%', style: 'smallListItemText', type: 'text'},
                    {text: "Type", field: "type", width: '5%',style: 'smallListItemText', type: 'text'},
                    {text: "Description", field: "description", width: '10%', style: 'smallListItemText', type: 'text'},
                    {text: "d_date", field: "drill_date", width: '6%',  type: 'date'},
                    {text: "d_crew", field: "drill_crew", width: '6%',  type: 'text'}, 
                    {text: "Art", field: "artwork", width: '6%', style: 'smallListItemText', type: 'text'},
                    {text: "Signs", field: "sign", width: '6%', style: 'smallListItemText', type: 'text'},
                    {text: "i_date", field: "install_date", width: '6%', type: 'date'},
                    {text: "i_crew", field: "install_crew", width: '6%',  type: 'text'}, 
                    {text: "Task Status", field: "completed_wo", width: '6%', type: 'number'}
                ];
                break;
            case 'default':
            default:
                viewArray =[
                    {text: "WO #", field: "table_id", width: '7%', type: 'number'},
                    {text: "Desired Date", field: "date_desired", width: '10%', style: 'boldListItemText', type: 'date'},
                    {text: "1st Game", field: "first_game", width: '10%', type: 'date'},
                    {text: "install_date", field: "install_date", width: '10%', type: 'date'},
                    {text: "Name", field: "t_name", width: '20%', style: 'boldListItemText', type: 'text'},
                    {text: "Type", field: "type", width: '8%', type: 'text'},
                    {text: "Description", field: "description", width: '19%', style: 'smallListItemText', type: 'text'},
                    {text: "Drill Status", field: "drilling", width: '8%', type: 'text'},
                    {text: "Task Status", field: "completed_wo", width: '8%', type: 'number'}
                ]
                break;
        }


        setTableInfo(viewArray)
    }

    

    const handleListSort = (event, item) =>{
        if(!item){
            cogoToast.error("Bad field while trying to sort");
            return;
        }
        //sort taskListItems according to item
        //this sort can take multiple sorters but i dont think its necessary
           // if it is, you will have to change the [0] to a dynamic index!
        if(item.type == 'date' || item.type == 'number' || item.type == 'text'){
            switch(sorterState){
                case 0:
                    setSorterState(1);
                    break;
                case 1:
                    if(sorters[0].property == item.field){
                        setSorterState(2)
                    }else{
                        setSorterState(1);
                    }
                    break;
                case 2:
                    setSorterState(1);
                    break;
                default: 
            }
            setSorters([{
                property: item.field, 
                direction: sorters && sorters[0] && sorters[0].property == item.field ? 
                        ( sorterState === 0 ? "ASC" : sorterState === 1 ? "DESC" : "ASC" ) : "ASC"
            }]);
            
        }
    }

    const handleClearSelectedTasksOnEsc = (keyCode) =>{
        if(isNaN(keyCode)){
            console.error("Bad keycode on handleClearSelectedTasksOnEsc");
            return;
        }
        if(keyCode === 27){
            setSelectedTasks([]);
        }
    }

     
    return(
        <>
            <KeyBinding onKey={ (e) => handleClearSelectedTasksOnEsc(e.keyCode) } />
            <TaskListToolbar openTaskList={openTaskList} setOpenTaskList={setOpenTaskList} 
                            taskListTasks={taskListTasks} setTaskListTasks={setTaskListTasks} 
                            isPriorityOpen={isPriorityOpen} setIsPriorityOpen={setIsPriorityOpen}
                            priorityList={priorityList} setPriorityList={setPriorityList} setSelectedIds={setSelectedIds}/>
            <Grid container >  
                <Grid item xs={2} >
                    <TaskListSidebar taskListTasks={taskListTasks} setTaskListTasks={setTaskListTasks}
                                 openTaskList={openTaskList} setOpenTaskList={setOpenTaskList} 
                                 isPriorityOpen={isPriorityOpen} setIsPriorityOpen={setIsPriorityOpen}
                                  priorityList={priorityList} setPriorityList={setPriorityList}
                                  selectedTasks={selectedTasks} setSelectedTasks={setSelectedTasks} setSelectedIds={setSelectedIds}
                                  handleChangeTaskView={handleChangeTaskView}  setTableInfo={setTableInfo}/>
                </Grid>
                <Grid item xs={10} >
                   
                    <Paper className={classes.root}>
                        <TaskListFilter taskListTasks={taskListTasks} setTaskListTasks={setTaskListTasks} filters={filters} setFilters={setFilters} filterInOrOut={filterInOrOut}
                                             setFilterInOrOut={setFilterInOrOut} openTaskList={openTaskList} table_info={table_info} selectedTasks={selectedTasks} setSelectedTasks={setSelectedTasks}/>
                        {taskListTasks && table_info ? 
                        <>
                            <ListItem className={classes.HeadListItem} classes={{container: classes.liContainer}}>
                                {table_info.map((item, i)=>{
                                    const isSorted =  sorters && sorters[0] && sorters[0].property == item.field;
                                    const isASC = sorterState === 1;
                                    return(
                                    <ListItemText id={"Head-ListItem"+i} 
                                                    key={item.field + i +'_head'}
                                                    className={classes.listItemText} 
                                                    style={{flex: `0 0 ${item.width}`}} 
                                                    classes={{primary: classes.listItemTextPrimary}}
                                                    onClick={event=>handleListSort(event, item)}
                                                    >
                                                        <span>
                                                    {item.text}
                                                    {isSorted ?
                                                         <div>
                                                             {isASC ? <ArrowDropDownIcon/> : <ArrowDropUpIcon/>}
                                                         </div> 
                                                         : <></>}
                                                         </span>
                                    </ListItemText>
                                )})}
                                <ListItemSecondaryAction>            
                                        <React.Fragment>
                                        <IconButton edge="end" aria-label="edit">
                                        
                                        </IconButton>
                                        <IconButton edge="end" aria-label="delete">
                                            
                                        </IconButton> 
                                        </React.Fragment>
                                    &nbsp;&nbsp;&nbsp;
                                </ListItemSecondaryAction>
                            </ListItem>
                            <TaskListTasks 
                                selectedTasks={selectedTasks} setSelectedTasks={setSelectedTasks}
                                taskListTasks={taskListTasks} setTaskListTasks={setTaskListTasks}
                                openTaskList={openTaskList} setOpenTaskList={setOpenTaskList}
                                setModalOpen={setModalOpen} 
                                setModalTaskId={setModalTaskId}
                                table_info={table_info}
                                priorityList={priorityList} setTaskListToMap={setTaskListToMap} setSelectedIds={setSelectedIds}
                                setMapRows={setMapRows} taskListTasksSaved={taskListTasksSaved}/>
                        </>
                        : <>
                        <ListItem className={classes.HeadListItem} classes={{container: classes.liContainer}}>
                                <ListItemText id="Head-ListItem" classes={{primary: classes.listItemTextPrimary}}>
                                        Select a Task List in the dropdown menu above.
                                </ListItemText>
                            </ListItem>
                        </>}

                        
                    </Paper>
                </Grid>
            </Grid>
            
            
        </>
    );

} 

export default TaskListMain;

const useStyles = makeStyles(theme => ({
    root: {
        padding: '.62% .3% .3% .3%',
        margin: '0px 0px 5px 5px',
        backgroundColor: '#eee',
        height: '100%',

    },
    HeadListItem:{
        backgroundColor: '#293a5a !important',
        boxShadow: '0px 0px 2px 0px rgba(0, 0, 0, 0.46)',
        fontSize: '12px',
        fontWeight: '700',
        display:'flex',
        flexWrap: 'nowrap',
        justifyContent: 'space-around',
        padding: '3px',
        paddingRight: '6%',
        
    },
    liContainer: {
        listStyle: 'none',
        margin: '5px 8px 0px 8px',
     },
    listItemTextPrimary:{
        '& span':{
            display: 'inline-flex',
            justifyContent: 'center',
            '&:hover':{
                textDecoration: 'underline',
                color: '#ececec',
                cursor: 'pointer',
            },
            '& .MuiSvgIcon-root':{
                position: 'absolute',
                marginLeft: '1px',
                top: '20%',
                fontSize: '1.5em',
            }
        },
        fontWeight: '600',
        color: '#ffffff',
     },
    listItemText:{
        textAlign: 'center',
     }

      
  }));
