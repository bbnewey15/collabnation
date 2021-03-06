import React, {useRef, useState, useEffect, useContext, useCallback} from 'react';
import dynamic from 'next/dynamic';
import { lighten, makeStyles } from '@material-ui/core/styles';
import {Paper, Switch, Table, TableBody, TableRow,TableCell, Checkbox, TableHead, TablePagination, 
        FormControlLabel, CircularProgress, Tooltip} from '@material-ui/core';
import PropTypes from 'prop-types';

import EnhancedTableHead from './EnhancedTableHead';
import EnhancedTableToolbar from './EnhancedTableToolbar';
import TaskModal from '../TaskModal/TaskModal';
import cogoToast from 'cogo-toast';
import { TaskContext } from '../TaskContainer';


const TableFilter = dynamic(
    () => import('react-table-filter'),
    {
        ssr: false
    }
)


  function desc(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }
  
  function stableSort(array, cmp) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = cmp(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map(el => el[0]);
  }
  
  function getSorting(order, orderBy) {
    return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
  }
  
  function EnhancedTable(props) {
    const classes = useStyles();

    const {rows, setRows, filterConfig,setFilterConfig} = props;
    const {  selectedIds, setSelectedIds, taskListToMap, setTaskListToMap, tabValue,
       filterSelectedOnly, setFilterSelectedOnly, filterScoreboardsAndSignsOnly, setFilterScoreboardsAndSignsOnly,
        modalOpen, setModalOpen, setModalTaskId} = useContext(TaskContext);

    const [order, setOrder] = React.useState('desc');
    const [orderBy, setOrderBy] = React.useState('date');
    //const [selected, setSelected] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [dense, setDense] = React.useState(true);
    const [rowsPerPage, setRowsPerPage] = React.useState(15);
    const [filteredRows, setFilteredRows] = React.useState(rows);
   
       //STATE
    const [filteredData, setFilteredData] = React.useState(filteredRows ? filteredRows :  rows);

    //useEffect for filterSelectedOnly
    useEffect(() =>{ 
      if(filteredData){
        if(filterSelectedOnly) {
          var tmp = filteredData.filter((row, i)=>{
            if(selectedIds.indexOf(row.t_id) !== -1){
              return true;
            }
            return false;
          });
          setFilteredRows(tmp);

        }
        else if(!filterScoreboardsAndSignsOnly /* or any other setting that changes filteredData */){
          setFilteredRows(filteredData);
        }
      }
    
      return () => { //clean up
          if(filteredData){
              
          }
      }
    },[filteredData, filterSelectedOnly]);

    //useEffect updates our table when filterSelectedOnly is true and selectedIds are changed
    // this is necessary to split dependencies of other useEffects
    useEffect(()=>{
      if(filteredData){
        if(filterSelectedOnly) {
          var tmp = filteredData.filter((row, i)=>{
            if(selectedIds.indexOf(row.t_id) !== -1){     return true;   }
            return false;
          });
          setFilteredRows(tmp);
        }
      }
    },[selectedIds])

    //useEffect for filterScoreboardsAndSignsOnly
    useEffect(() =>{ 
      if(filteredData){
        if(filterScoreboardsAndSignsOnly) {
          var tmp = filteredData.filter((row, i)=>(  row.type == "Shipment" || row.type=="Install" || row.type=="Delivery" ));
          setFilteredRows(tmp);
        }
        else if(!filterSelectedOnly /* or anyother setting that interferes*/ ){
          setFilteredRows(filteredData);
        }
      }
    
      return () => { //clean up
          if(filteredData){
              
          }
      }
    },[filteredData, filterScoreboardsAndSignsOnly]);


    //useEffect updates our table rows when rows is refetched
    useEffect(()=>{
      setFilteredData(rows);
    },[rows])

    useEffect( ()=>{
      //if changed to tasks tab and theres no selected ids, turn off unselected filter
      if(filterSelectedOnly && selectedIds.length == 0){
        setFilterSelectedOnly(false);
      }
    }, [tabValue]);


    const handleRequestSort = (event, property) => {
      const isDesc = orderBy === property && order === 'desc';
      setOrder(isDesc ? 'asc' : 'desc');
      setOrderBy(property);
    };
  
    const handleSelectAllClick = event => {
      if (selectedIds.length <= 0) {
        const newSelecteds = filteredRows ? filteredRows.map(n=>n.t_id) : rows.map(n => n.t_id);
        setSelectedIds(newSelecteds);
        return;
      }
      // if unchecked
      setSelectedIds([]);
      setFilterSelectedOnly(false);
    };

    const handleClick = (event, record_id) => {

      const selectedIndex = selectedIds.indexOf(record_id);
      let newSelected = [];
      const row = filteredRows.filter((row, index)=> row.t_id == record_id);
      if(row == []){
        error.log("No row found in filteredRows");
      }

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selectedIds, record_id);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selectedIds.slice(1));
      } else if (selectedIndex === selectedIds.length - 1) {
        newSelected = newSelected.concat(selectedIds.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          selectedIds.slice(0, selectedIndex),
          selectedIds.slice(selectedIndex + 1),
        );
      }
    
      setSelectedIds(newSelected);

    };



    //Modal
    const handleRightClick = (event, id) => {
      setModalTaskId(id);
      setModalOpen(true);

      //Disable Default context menu
      event.preventDefault();
    };
    ////
  
    const handleChangePage = (event, newPage) => {
      setPage(newPage);
    };
  
    const handleChangeRowsPerPage = event => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };
  
    const handleChangeDense = event => {
      setDense(event.target.checked);
    };
  
    const isSelected = record_id => selectedIds.indexOf(record_id) !== -1;
  
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, (filteredRows ? filteredRows.length : rows ? rows.length : 0  ) - page * rowsPerPage);
  
    return (
      <div className={classes.root}>
         
        <div className={classes.paper}>
          <EnhancedTableToolbar numSelected={selectedIds.length}/>
            <Table
              className={classes.table}
              aria-labelledby="tableTitle"
              size={dense ? 'small' : 'medium'}
              aria-label="enhanced table"
            >
              <EnhancedTableHead
                classes={classes}
                disabled={filterSelectedOnly}
                numSelected={selectedIds.length}
                order={order}
                orderBy={orderBy}
                onSelectAllClick={handleSelectAllClick}
                onRequestSort={handleRequestSort}
                rowCount={ filteredRows ? filteredRows.length : rows ? rows.length : 0}
                filteredRows={filteredRows ? filteredRows : rows}
                setFilteredRows={setFilteredRows}
                filterConfig={filterConfig}
                setFilterConfig={setFilterConfig}
                selectedIds={selectedIds}
                taskListToMap={taskListToMap}
                filterSelectedOnly={filterSelectedOnly} setFilterSelectedOnly={setFilterSelectedOnly}
                filterScoreboardsAndSignsOnly={filterScoreboardsAndSignsOnly} setFilterScoreboardsAndSignsOnly={setFilterScoreboardsAndSignsOnly}
                tabValue={tabValue}
                setPage={setPage}
              />
              <Tooltip title="Click to Select. You can select multiple items. Right Click to Edit"
                            arrow={true} enterDelay={700} placement={'bottom'} disableHoverListener={selectedIds.length == 0 ? false : true}
                            classes={{tooltip: classes.tooltip }}>
            
              <TableBody>
              {rows ? <>
                {stableSort(filteredRows ? filteredRows : rows, getSorting(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    const isItemSelected = isSelected(row.t_id);
                    const labelId = `enhanced-table-checkbox-${index}`;
                    
                    return (
                      <TableRow
                        hover
                        onMouseUp={event => handleClick(event, row.t_id)}
                        onContextMenu={event => handleRightClick(event, row.t_id)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={row.t_id}
                        className={isItemSelected ? classes.selectedRow : classes.nonSelectedRow}
                      >
                        
                        <TableCell component="th" id={labelId} scope="row" padding="none">
                          {row.t_id /*if you change t_id, change it above */}
                        </TableCell>
                        <TableCell align="center">{row.table_id}</TableCell>
                        <TableCell align="center">{row.wo_date}</TableCell>
                        <TableCell align="left">{row.t_name}</TableCell>
                        <TableCell align="left">{row.description}</TableCell>
                        <TableCell align="center">{row.type}</TableCell>
                        <TableCell align="center">{row.date_desired}</TableCell>
                        <TableCell align="center">{row.completed_wo == 0 ? 'NC' : 'COMP'}</TableCell>
                      </TableRow>
                    );
                  })}
                    {emptyRows > 0 && (
                      <TableRow style={{ height: (dense ? 33 : 53) * emptyRows }}>
                        <TableCell colSpan={6} />
                      </TableRow>
                    )}
                    </>:
              <div>
                <CircularProgress/>
              </div>
            }
                </TableBody>
                
              </Tooltip>
            </Table>
      
          <TablePagination
            rowsPerPageOptions={[15, 30, 50]}
            component="div"
            count={ filteredRows ? filteredRows.length : rows ? rows.length : 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </div>
        
        <FormControlLabel
          control={<Switch checked={dense} onChange={handleChangeDense} />}
          label="Dense padding"
        />
      </div>
    );
  }

  export default EnhancedTable;

  const useStyles = makeStyles(theme => ({
    root: {
      width: '100%',
    },
    paper: {
      width: '100%',
      marginBottom: theme.spacing(2),
    },
    table: {
      minWidth: 750,
      '&& .MuiTableCell-paddingNone': {
        padding: '6px 24px 6px 16px',
      }
    },
    visuallyHidden: {
      border: 0,
      clip: 'rect(0 0 0 0)',
      height: 1,
      margin: -1,
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      top: 20,
      width: 1,
    },
    selectedRow:{
      backgroundColor: '#abb7c9',
      '&:hover':{
        backgroundColor: 'rgb(142, 166, 201) !important'
      }
      
    },
    nonSelectedRow:{
      backgroundColor: '#ffffff',
      '&:hover':{
        backgroundColor: 'rgba(0, 0, 0, 0.07) !important'
      }
    },
    tableHead:{
      fontSize: 11,
      fontWeight: 600,
    },
    tableFilter: {
      margin: '50px',
    },
    tooltip:{
        fontSize: '18px',
        padding: '4px 5px',
        width: '100%',
        backgroundColor: 'rgba(0,0,0,.50)'
    },
    borderButton:{
      border: '1px solid rgb(255, 237, 196)',
      '&:hover':{
        border: '',
        backgroundColor: '#ffedc4',
        color: '#d87b04'
      }
    },
    filterButton:{
      margin: '0px 10px',
      backgroundColor: 'rgba(0,0,0,.30)',
      color: '#fff',
      '&&:hover':{
          backgroundColor: 'rgba(0,0,0,.40)',
          color: '#000',
      }
    },
    filterButtonActive:{
        margin: '0px 10px',
        backgroundColor: '#fdfdfd',
        color: '#0067d2',
        fontWeight: '500',
        border: '1px solid #173b7e',
        '&&:hover':{
            backgroundColor: '#97bec9',
            color: '#000',
        }
    },
    filter_column:{
      background: '#02eabf38'
    },
    filter_div:{
      display: 'flex',
      flexDirection: 'row',
    },
    filter_head_div:{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      borderRight: '1px solid #a0a0a0',
      padding: '0% 2%',
      fontWeight: '500',
      fontSize: '12px',
      color: '#37655c',
    },
    actions_column:{
      background: '#fca43752'
    },
    actions_div:{
      display: 'flex',
      flexDirection: 'row',
    },
    actions_head_div:{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      borderRight: '1px solid #a0a0a0',
      padding: '0% 2%',
      fontWeight: '500',
      fontSize: '12px',
      color: '#6d4617',
    }
    
  }));