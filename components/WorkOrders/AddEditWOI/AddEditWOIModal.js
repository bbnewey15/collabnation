import React, {useRef, useState, useEffect, useContext} from 'react';
import {makeStyles, withStyles,Modal, Backdrop, Fade, Grid,ButtonGroup, Button,TextField, InputBase, Select, MenuItem,
     Checkbox,IconButton, Radio, RadioGroup, FormControl, FormControlLabel, CircularProgress} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import DeleteIcon from '@material-ui/icons/Delete';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

import { confirmAlert } from 'react-confirm-alert'; // Import
import ConfirmYesNo from '../../UI/ConfirmYesNo';

import Autocomplete from '@material-ui/lab/Autocomplete';

import cogoToast from 'cogo-toast';

import DateFnsUtils from '@date-io/date-fns';
import {
    DatePicker,
    KeyboardDatePicker,
    TimePicker,
    MuiPickersUtilsProvider,
  } from '@material-ui/pickers';

import Util from '../../../js/Util.js';
import FormBuilder from '../../UI/FormComponents/FormBuilder'

import Settings from  '../../../js/Settings';
import Work_Orders from  '../../../js/Work_Orders';
import { ListContext } from '../WOContainer';
import { DetailContext } from '../WOContainer';


const AddEditWOIModal = function(props) {
    const {user } = props;

    const { workOrders, setWorkOrders, rowDateRange, setDateRowRange, detailWOid, setDetailWOid,
    currentView, setCurrentView, views, activeWorkOrder,setActiveWorkOrder, editWOModalOpen, setEditWOModalOpen, raineyUsers} = useContext(ListContext);

    const {editWOIModalMode,setEditWOIModalMode, activeWOI, setActiveWOI, workOrderItems, setWorkOrderItems,editWOIModalOpen,
        setEditWOIModalOpen, vendorTypes, shipToOptionsWOI, setShipToOptionsWOI} = useContext(DetailContext)
    
    const saveRef = React.createRef();
    

    const classes = useStyles();

    const handleCloseModal = () => {
        setActiveWOI(null);
        setEditWOIModalOpen(false);
    };

    


    const woi_fields = [
        //type: select must be hyphenated ex select-type
        {field: 'item_type', label: 'Item Type', type: 'radio-type', updateBy: 'state', defaultValue: 3 ,required: true},
        {field: 'quantity', label: 'Quantity*', type: 'text', updateBy: 'ref',required: true},
        {field: 'part_number', label: 'Part Number', type: 'text', updateBy: 'ref'},
        {field: 'size', label: 'Size', type: 'text', updateBy: 'ref'},
        {field: 'description', label: 'Description', type: 'text', updateBy: 'ref', multiline: true},
        {field: 'price', label: 'Price', type: 'text', updateBy: 'ref',defaultValue: (0.00).toFixed(2) ,},
        {field: 'contact', label: 'Ship To', type: 'select-ship_to', updateBy: 'state'},
        //Repair or Loaner
        {field: 'receive_date', label: 'Receive Date', type: 'date', updateBy: 'state', hidden: (current_wo)=> current_wo?.item_type == 3 },
        {field: 'receive_by', label: 'Receive By', type: 'select-users', updateBy: 'state', hidden: (current_wo)=> current_wo?.item_type == 3},
    ];

    const scbd_or_sign_fields = [
        {field: 'scoreboard_or_sign', label: '', type: 'radio-scbd_or_sign', updateBy: 'state',required: true,defaultValue: 0 ,},
        //Scoreboard OR Sign
        {field: 'vendor', label: 'Vendor', type: 'select-vendor', updateBy: 'state', hidden: (current_wo)=> current_wo?.scoreboard_or_sign == 0},
        //Scoreboard
        {field: 'model', label: 'Model', type: 'auto', updateBy: 'state', hidden: (current_wo)=> current_wo?.scoreboard_or_sign != 1, ref: React.useRef(null),
            dataGetterFunc: async () =>{
                return new Promise(async function (resolve, reject) {
                     try{
                         var results = await Settings.getPastScoreboardParams("model")
                         resolve(results);
                     }
                     catch(error){
                         reject(error);
                         console.error("Failed to get models", error)
                     }
                })
            }},
        {field: 'color', label: 'Color', type: 'auto', updateBy: 'state', hidden: (current_wo)=> current_wo?.scoreboard_or_sign != 1, ref: React.useRef(null),
            dataGetterFunc: async () =>{
                return new Promise(async function (resolve, reject) {
                    try{
                        var results = await Settings.getPastScoreboardParams("color")
                        resolve(results);
                    }
                    catch(error){
                        reject(error);
                        console.error("Failed to get colors", error)
                    }
               })
            }},
        {field: 'trim', label: 'Trim', type: 'text', updateBy: 'ref', hidden: (current_wo)=> current_wo?.scoreboard_or_sign != 1},
        {field: 'scoreboard_arrival_date', label: 'Arrival Date', type: 'date', updateBy: 'state', hidden: (current_wo)=> current_wo?.scoreboard_or_sign != 1},
        {field: 'scoreboard_arrival_status', label: 'Arrival Status', type: 'text', updateBy: 'ref', hidden: (current_wo)=> current_wo?.scoreboard_or_sign != 1},
        //Sign
        {field: 'mount', label: 'Mount', type: 'text', updateBy: 'ref', hidden: (current_wo)=> current_wo?.scoreboard_or_sign != 2},
        {field: 'trim_size', label: 'Trim Size', type: 'text', updateBy: 'ref', hidden: (current_wo)=> current_wo?.scoreboard_or_sign != 2},
        {field: 'trim_corners', label: 'Trim Corners', type: 'text', updateBy: 'ref', hidden: (current_wo)=> current_wo?.scoreboard_or_sign != 2},
        {field: 'date_offset', label: 'Date Offset', type: 'text', updateBy: 'ref',defaultValue: 0, hidden: (current_wo)=> current_wo?.scoreboard_or_sign != 2},
        {field: 'sign_due_date', label: 'Sign Due Date', type: 'date', updateBy: 'state', hidden: (current_wo)=> current_wo?.scoreboard_or_sign != 2},
    ];

    const scbd_or_sign_radio_options = [
        {displayField: 'Scoreboard', value: 1 },
        {displayField: 'Sign', value: 2 },
        {displayField: 'N/A', value: 0 },
    ]

    const item_type_radio_options = [
        {displayField: 'Repair', value: 1 },
        {displayField: 'Loaner', value: 2 },
        {displayField: 'Billing Item', value: 3 },
    ]

    
    //Set active worker to a tmp value for add otherwise activeworker will be set to edit
    useEffect(()=>{
        if(editWOIModalOpen && editWOIModalMode == "add"){
            setActiveWOI({item_type: 3, scoreboard_or_sign: 0, date_offset: 0, price: 0.00  });
        }
    },[editWOIModalMode, editWOIModalOpen])


    const handleSave = (woi, updateItem, addOrEdit) => {
        return new Promise((resolve, reject)=>{
            //Add Id to this new object
            if(addOrEdit == "edit"){
                updateItem["record_id"] = woi.record_id;

                Work_Orders.updateWorkOrderItem( updateItem )
                .then( (data) => {
                    //Refetch our data on save
                    cogoToast.success(`Work Order Item ${woi.record_id} has been updated!`, {hideAfter: 4});
                    setWorkOrderItems(null);
                    handleCloseModal();
                    resolve(data)
                })
                .catch( error => {
                    console.error("Error updating woi.",error);
                    cogoToast.error(`Error updating woi. ` , {hideAfter: 4});
                    reject(error)
                })
            }
            if(addOrEdit == "add"){
                updateItem["work_order"] = activeWorkOrder.wo_record_id;
                Work_Orders.addWorkOrderItem( updateItem )
                .then( (data) => {
                    //Get id of new workorder item 
                    if(data && data.insertId){
                        setWorkOrderItems(null);
                    }
                    cogoToast.success(`Work Order Item has been added!`, {hideAfter: 4});
                    handleCloseModal();
                    resolve(data);
                })
                .catch( error => {
                    console.warn(error);
                    cogoToast.error(`Error adding woi. ` , {hideAfter: 4});
                    reject(error)
                })
            }
            reject("No ending in handleSave in AddEditWOI MODAL")
        })
    }
        
    

    const handleDeleteWOI = (woi) => {
        if(!woi || !woi.record_id){
            console.error("Bad woi in delete WOI");
            return;
        }

        const deleteWOI = () =>{
            Work_Orders.deleteWorkOrderItem(woi.record_id)
            .then((data)=>{
                setWorkOrderItems(null);
                handleCloseModal();
            })
            .catch((error)=>{
                cogoToast.error("Failed to Delete woi")
                console.error("Failed to delete woi", error);
            })
        }

        confirmAlert({
            customUI: ({onClose}) => {
                return(
                    <ConfirmYesNo onYes={deleteWOI} onClose={onClose} customMessage={"Delete Work Order Item permanently?"}/>
                );
            }
        })
    }

    return(<>
        { editWOIModalOpen && <Modal
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            className={classes.modal}
            open={editWOIModalOpen}
            onClose={handleCloseModal}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
            timeout: 500,
            }}
        >
            <Fade in={editWOIModalOpen}>
                
                <div className={classes.container}>
                    {/* HEAD */}
                    <div className={classes.modalTitleDiv}>
                        <span id="transition-modal-title" className={classes.modalTitle}>
                            { activeWOI?.record_id ? `Edit WOI#: ${activeWOI?.record_id}` : 'Add Work Order Item'} 
                        </span>
                    </div>


                    {/* BODY */}
                     
                    <Grid container className={classes.grid_container} >  
                        <Grid item xs={ 12 } className={classes.paperScroll}>
                            {/*FORM*/}
                            <FormBuilder 
                                ref={saveRef}
                                fields={[...woi_fields, ...scbd_or_sign_fields]} 
                                mode={editWOIModalMode} 
                                classes={classes} 
                                formObject={activeWOI} 
                                setFormObject={setActiveWOI}
                                handleClose={handleCloseModal} 
                                handleSave={handleSave}
                                scbd_or_sign_radio_options={scbd_or_sign_radio_options} shipToOptionsWOI={shipToOptionsWOI}
                                raineyUsers={raineyUsers} vendorTypes={vendorTypes} item_type_radio_options={item_type_radio_options}/>

                        </Grid>
                    </Grid>
                    

                    {/* FOOTER */}
                    <Grid container >
                        <Grid item xs={12} className={classes.paper_footer}>
                        { editWOIModalMode == "edit" && activeWOI?.record_id ? <ButtonGroup className={classes.buttonGroup}>
                            <Button
                                    onClick={() => handleDeleteWOI(activeWOI)}
                                    variant="contained"
                                    size="large"
                                    className={classes.deleteButton}
                                >
                                    <DeleteIcon />Delete
                        </Button></ButtonGroup> :<></>}
                        <ButtonGroup className={classes.buttonGroup}>
                            <Button
                                    onClick={() => handleCloseModal()}
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    className={classes.saveButton}
                                >
                                    Close
                                </Button></ButtonGroup>
                            <ButtonGroup className={classes.buttonGroup}>
                                
                                <Button
                                    onClick={ () => { saveRef.current.handleSaveParent(activeWOI) }}
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
            </Fade>
    </Modal>}
    </>) 
    }

export default AddEditWOIModal;

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
    paperScroll: {
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: '3% !important',
        position: 'relative',
        overflowY: 'auto',
        maxHeight: '650px',

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
        width: '70%',
        textAlign: 'center',
    },
    grid_container:{
        minHeight: 500,
    },
    modalTitleDiv:{
        background: 'linear-gradient(0deg, #f1f1f1, white)',
        padding: '5px 0px 5px 0px',
        borderRadius: '6px 6px 0px 0px',
    },
    modalTitle: {
        fontSize: '18px',
        fontWeight: '300',
        color: '#444',
    },
    saveButton:{
        backgroundColor: '#414d5a'
    },
    deleteButton:{
        backgroundColor: '#c4492e',
        '&:hover':{
            backgroundColor: '#f81010',
        }
    },
    buttonGroup: {
        marginLeft: '1%',
        '& .MuiButton-label':{
            color: '#fff',
        },
        '&:hover':{
            '& .MuiButton-label':{
                color: '#52c7ff',
                
            },
        }
    },
    deleteButtonGroup: {
        marginLeft: '1%',
        '& .MuiButton-label':{
            color: '#fff',
        },
        '&:hover':{
            '& .MuiButton-label':{
                color: '#52c7ff',
                
            },
        }
    },
    text_button:{
        cursor: 'pointer',
        fontSize: '14px',
        color: '#fff',
        margin: '1% 2%',
        padding: '1%',
    },
    inputDiv:{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '80%',
        minHeight: '25px',
    //   padding: '4px 0px 4px 0px',
        borderBottom: '1px solid #eee'
    },
    inputStyle:{
        padding: '5px 7px',
        width: '100%',
        
    },
    inputStyleDate:{
        padding: '5px 7px',
        width: '175px',
        
    },
    inputRoot: {
        padding: '5px 7px',
        width: '100%',
        '&& .MuiOutlinedInput-multiline': {
            padding: '0px'
        },
    },
    inputLabel:{
        flexBasis: '30%',
        textAlign: 'right',
        marginRight: '35px',
        fontSize: '15px',
        color: '#787878',
    },
    inputValue:{
        flexBasis: '70%',
        textAlign: 'left',
    },
    inputValueSelect:{
        flexBasis: '70%',
        textAlign: 'left',
        padding: '5px 7px',
    },
    inputFieldMatUi: {
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
        },
        inputSelect:{
            width: '100%',
        },
    },
    errorSpan:{
        color: '#bb4444',
    },
    radioGroup:{
        flexWrap: 'nowrap',
        justifyContent: 'center'
    },
    radioFormControl:{
        flexBasis: '70%',
    },
    radio:{
        color: '#000 !important',
    },
    multiline:{
        padding: 0,
    },
    underline: {
        "&&&:before": {
          borderBottom: "none"
        },
        "&&:after": {
          borderBottom: "none"
        },
        border: '1px solid #c4c4c4',
        borderRadius: 4,
        '&:hover':{
            border: '1px solid #555',
        }
    },
    optionLi:{
        padding: 0,
        borderBottom: '1px solid #ececec',
        '&:last-child':{
            borderBottom: '1px solid #fff'
        },
       
    },
    optionList:{
        padding: '5px 1px 5px 1px',
        border: '1px solid #888',
        borderTop: "none",
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'stretch',
    },
    optionDiv:{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems:'center',
        width: '100%',
        backgroundColor: '#fff',
        borderLeft: '2px solid #fff',
         '&:hover':{
          backgroundColor: '#d3d3d3',
          borderLeft: '2px solid #ff9007'
        },
      },
      optionSearchValueSpan:{
        fontFamily: 'sans-serif',
        color: '#000',
        overflow: 'hidden',
        maxWidth: '200px',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        padding: '1px 5px 1px 5px',
      },
      optionSearchResultsSpan:{
        padding: '4px 5px 4px 10px',
        fontFamily: 'sans-serif',
        color: '#888',
        flexBasis: '20%'
      },
      autocompleteRoot:{
          width: '70%',
      },
      actualInputElement:{
        
        padding: '4px 5px !important',
        
      }
}));

