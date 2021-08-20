import React, {useRef, useState, useEffect,useContext} from 'react';
import {makeStyles, CircularProgress, Grid} from '@material-ui/core';

import ContentHeading from '../../UI/Reuseables/ContentHeading';
import cogoToast from 'cogo-toast';
import {createSorter} from '../../../js/Sort';

import Util from '../../../js/Util';
import Settings from '../../../js/Settings';

import FormBuilder from '../../UI/FormComponents/FormBuilder';

//Page Panels
//import InvOrdersInContainer from './Inv_OrdersIn/InvOrdersInContainer';
import _ from 'lodash';
import { ProfileContext } from '../ProfileContainer';
import { SubContext } from './ProfileMainContainer';



const ProfileMainBasicInfo = function(props) {


    const {  currentView,setCurrentView,user} = useContext(ProfileContext);
    const {basicInfoObject,setBasicInfoObject, setBasicInfoObjectRefetch, resetWOIForm, setResetWOIForm} = useContext(SubContext);
    
    const classes = useStyles();

    const basic_info_table = [
        {field: 'name', label: "Name", type: "text", updateBy: 'ref', required: true},
        {field: 'age', label: "Age", type: "number", updateBy: 'ref', required: true},
        {field: 'zip', label: "Zipcode", type: "number", updateBy: 'ref', required: true},
        {field: 'instruments_played', label: "Instrument Knowledge", type: "multi-instruments_played", 
                    updateBy: 'state', options: 'instruments_played_options', required: true},
        {field: 'style', label: "Music Style", type: "multi-style", updateBy: 'state',
                    options: "style_options", required: true},
        {field: 'experience', label: "Experience Level", type: "select-exp_level", updateBy: 'state',
                    options: "experience_options" ,required: true},
        {field: 'theory', label: "Music Theory Knowledge", type: "select-theory_level", updateBy: 'state',
                    options: "theory_options" , required: true},
        {field: 'recording', label: "Recording Knowledge", type: "select-recording_level", updateBy: 'state',
                    options: "recording_level_options" ,required: true},
        {field: 'influences', label: "Influences", type: "text",multiline: true, updateBy: 'ref'},
        {field: 'bio', label: "Bio", type: "text",multiline: true, updateBy: 'ref'},
        {field: 'equipment', label: "Equipment", type: "text",multiline: true, updateBy: 'ref'},
        {field: 'url1', label: "URL1", type: "url", updateBy: 'ref'},
        {field: 'url2', label: "URL2", type: "url", updateBy: 'ref'},
    ];

    const instruments_played_options = [
        { value: 0,displayField: 'Guitar', },
        { value: 1,displayField: 'Bass', },
        { value: 2,displayField: 'Drums', },
    ]

    const style_options = [
        { value: 0,displayField: 'Blues', },
        { value: 1,displayField: 'Funk', },
        { value: 2,displayField: 'Rock', },
    ]

    const experience_options = [
        { value: 0,displayField: 'None', },
        { value: 1,displayField: 'Some', },
        { value: 2,displayField: 'Intermediate ( Some Gigs, recording )', },
        { value: 3,displayField: 'Expert (Lots of gigs, recording)', },
    ]

    const theory_options = [
        { value: 0,displayField: 'None', },
        { value: 1,displayField: 'Some (Scales, Keys, Chords)', },
        { value: 2,displayField: 'Intermediate ( Modes, Areggios )', },
        { value: 3,displayField: 'Expert', },
    ]

    const recording_level_options = [
        { value: 0,displayField: 'None', },
        { value: 1,displayField: 'Some', },
        { value: 2,displayField: 'Intermediate', },
        { value: 3,displayField: 'Expert', },
    ]

    const saveRef = React.createRef();
    const [saveButtonDisabled, setSaveButtonDisabled] = React.useState(false);

    useEffect(()=>{

        if( resetWOIForm && saveRef?.current ){
            //resets the form when you change something by state
            saveRef.current.handleResetFormToDefault()
            setResetWOIForm(false);
        }
    },[resetWOIForm, saveRef])

    const handleSwitchBackFromEdit = () => {
        //setBasicInfoRefetch(null);
        //setEditWOIModalOpen(false);
        setSaveButtonDisabled(false)
    };

    const handleSave = (woi, updateItem, addOrEdit) => {

        if (saveButtonDisabled) {
            return;
        }
        setSaveButtonDisabled(true);

        return new Promise((resolve, reject)=>{
            //Add Id to this new object
            if(addOrEdit == "edit"){
                updateItem["id"] = woi.id;

                // Work_Orders.updateWorkOrderItem( updateItem )
                // .then( (data) => {
                //     //Refetch our data on save
                //     cogoToast.success(`Work Order Item ${woi.record_id} has been updated!`, {hideAfter: 4});
                //     setWorkOrderItems(null);
                //     //setActiveWOI({contact: updateItem.contact || null })
                //     //handleCloseModal();
                //     setSaveButtonDisabled(false)
                //     resolve(data)
                    
                // })
                // .catch( error => {
                //     console.error("Error updating woi.",error);
                //     cogoToast.error(`Error updating woi. ` , {hideAfter: 4});
                //     setSaveButtonDisabled(false)
                //     reject(error)
                    
                // })
            }
            if(addOrEdit == "add"){
                updateItem["work_order"] = activeWorkOrder.wo_record_id;
                // Work_Orders.addWorkOrderItem( updateItem )
                // .then( (data) => {
                //     //Get id of new workorder item 
                //     if(data && data.insertId){
                //         setWorkOrderItems(null);
                //     }
                //     cogoToast.success(`Work Order Item has been added!`, {hideAfter: 4});
                //     setActiveWOI({contact: updateItem.contact || null ,item_type: 3, scoreboard_or_sign: 0, date_offset: 0, price: 0.00 })
                //     setResetWOIForm(true)
                //     //handleCloseModal();
                //     setSaveButtonDisabled(false)
                //     resolve(data);
                // })
                // .catch( error => {
                //     console.warn(error);
                //     setSaveButtonDisabled(false)
                //     cogoToast.error(`Error adding woi. ` , {hideAfter: 4});
                //     reject(error)
                // })
            }
        })
    }

    return (
        <div className={classes.root}>
            <ContentHeading text={"Basic Info"}/>
            <div>
                <FormBuilder 
                    ref={saveRef}
                    //columns={true}
                    id_pretext={"basic_info_input"}
                    fields={[...basic_info_table]} 
                    mode={basicInfoObject?.id ? "edit" : "add"} 
                    classes={classes} 
                    formObject={basicInfoObject} 
                    setFormObject={setBasicInfoObject}
                    handleClose={handleSwitchBackFromEdit} 
                    handleSave={handleSave}
                    instruments_played_options={instruments_played_options} style_options={style_options} experience_options={experience_options}
                    theory_options={theory_options} recording_level_options={recording_level_options}
                    dontCloseOnNoChangesSave={true}/>
                            
            </div>

        </div>
    );
}

export default ProfileMainBasicInfo

const useStyles = makeStyles(theme => ({
  root:{
    background: '#fff',
    fontFamily: 'arial',
  },
  heading:{
    width: '100%',
  },
  headingSpan:{
    fontSize: '2em',
    color: "#555",
  },
  inputDiv:{
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    minHeight: '25px',
   padding: '4px 0px 4px 0px',
    borderBottom: '1px solid #f8f8f8'
},
inputStyle:{
    padding: '2px 7px',
    width: '100%',
    
},
actualInputElement:{
    padding: '2px 7px !important',
    width: '100%',
    
  },
inputStyleDate:{
    padding: '5px 7px',
    width: '175px',
    
},
inputRoot: {
    padding: '3px 7px',
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

}));