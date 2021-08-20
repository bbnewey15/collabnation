import React, {useRef, useState, useEffect, useContext, forwardRef, useImperativeHandle} from 'react';
import {makeStyles, withStyles,Modal, Backdrop, Fade, Grid,ButtonGroup, Button,TextField, InputBase, Select, MenuItem,
     Checkbox,IconButton, Radio, RadioGroup, FormControl, FormControlLabel, CircularProgress} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import DeleteIcon from '@material-ui/icons/Delete';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import AccountBoxIcon from '@material-ui/icons/AccountBox';

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

import clsx from 'clsx';
import _ from 'lodash';
import { AddCircleOutline } from '@material-ui/icons';

const FormBuilder = forwardRef((props, ref) => {
    const { fields, //table of each input field
            columns,
            id_pretext,
            mode,  //edit or add mode 
            classes, //classes given to fields
            formObject, //object that is being edited/updated to save to db
            setFormObject, //setter for object
            handleClose, //close function supplied to run on close
            handleSave,//save function supplied with update object on save, handleSaveParent is exposed to parent component via saveRef
            item_type_radio_options, //specific data for woi item_type
            scbd_or_sign_radio_options, //specific data for woi scoreboard_or_sign
            jobTypes, //specific data for woi job types, for some reason only works when referenced as props.jobTypes (its not camelcase)
            entityTypes,
            defaultAddresses,
            entContactTitles,//specific date for entities contacts title
            shipToContactOptionsWOI, //specific data for woi ship_to
            shipToAddressOptionsWOI,
            vendorTypes, //specific data for woi vendor
            raineyUsers, //specific data for all select-users
            entityShippingContacts, setEntityShippingContacts,
            entityShippingAddresses, setEntityShippingAddresses,
            entityBillingContacts, setEntityBillingContacts,
            entityBillingAddresses, setEntityBillingAddresses,
            setEntityShippingContactEditChanged, setEntityBillingContactEditChanged, //state for knowing when to show entity defaults or actual wo value
            dontCloseOnNoChangesSave = false,
            partTypes,
            kitPartsManItems, setKitsPartsManItemsRefetch,
            manufacturers
        } = props;
        console.log("Props", props);
        
    const [shouldUpdate, setShouldUpdate] = useState(false);
    const [errorFields,setErrorFields] = useState([]);
    const [validErrorFields,setValidErrorFields] = useState([]);

    //Building an object of refs to update text input values instead of having them tied to state and updating every character
    const buildRefObject = arr => Object.assign({}, ...Array.from(arr, (k) => { return ({[k]: useRef(null)}) }));
    const [ref_object, setRef_Object] = React.useState(buildRefObject(fields.map((v)=> v.field)));

    
    const handleCloseParent = () =>{
        setShouldUpdate(false);
        setErrorFields([]);

        if(handleClose){
            console.log("Closing");
            handleClose();
        }
    }

    const handleShouldUpdate = (update) =>{
        setShouldUpdate(update)
    }


    // useEffect(()=>{
    //     if(formObject){
    //         //reset fields to either defaultValue or blank
    //         for( const ref in ref_object){
    //             if(ref_object[ref].current){
    //                 ref_object[ref].current.value = formObject[ref] || fields.find((f)=> f.field == ref)?.defaultValue || null
    //             }
    //         }
    //     }
    // },[formObject])

    

    const handleInputOnChange = (value, should, type, key) => {
        //this function updates by state instead of ref
        if( !type || !key){
            console.error("Bad handleInputOnChange call");
            return;
        }
        
        var tmpObject = {...formObject};

        if(type === "date" || type === "datetime") {
            tmpObject[key] = value ? Util.convertISODateTimeToMySqlDateTime(value) : value;
        }
        if(type.split('-')[0] === "select"){
            console.log("InputChange value ", value.target.value);
            tmpObject[key] = value.target.value == 0 ? null : value.target.value;
          
            if(type === "select-entity-contact"){
                if(key === "customer_contact_id"){
                    setEntityShippingAddresses(null);
                    tmpObject["customer_address_id"] = null;

                    // Stupid state logic for telling formbuilder to use entity defaults in EDIT mode after a change to entity
                    setEntityShippingContactEditChanged(true);
                }
                if(key === "account_contact_id"){
                    setEntityBillingAddresses(null);
                    tmpObject["account_address_id"] = null;

                    // Stupid state logic for telling formbuilder to use entity defaults in EDIT mode after a change to entity
                    setEntityBillingContactEditChanged(true);
                }
                
            }
        }
        if(type.split('-')[0] === "radio"){
            tmpObject[key] = value;
        }
        if(type.split('-')[0] === "auto"){
            tmpObject[key] = value;
        }
        if(type === "check"){
            tmpObject[key] = value;
        }
        if(type === "entity"){
            tmpObject[key[0]] = value[0];
            tmpObject[key[1]] = value[1];
        }
        if(type === "entity-titles"){
            console.log("Entity-Titles inputChange")
            tmpObject[key] = value;
        }
        if(type === "order_kit_select"){
            let subtype = key.split('-')[0];
            let rainey_id = parseInt(key.split('-')[1]);
            let index = tmpObject[`kit_items`] ?  _.findIndex(tmpObject[`kit_items`], (item)=> item.rainey_id === rainey_id ) : null;

            let updateValue;
            switch (subtype){
                case "part_mf_id":
                    updateValue =  value.target.value == 0 ? null : value.target.value
                    break;
                case "qty_in_order":
                case "actual_cost_each":
                    updateValue =  value.target.value
                    break;
                default:
                    updateValue =  value.target.value
                    break;
            }
            //If item is in array
            if(index != -1 && index != null && index != undefined){

                tmpObject[`kit_items`][index][subtype] =  updateValue;
                
            }else{
                //Item not in array yet or object not defined
                if(tmpObject[`kit_items`] == undefined){
                    tmpObject[`kit_items`]= [];
                }
                
                tmpObject[`kit_items`].push({rainey_id, [subtype]: updateValue })
       
            }
            console.log(`${key}`, tmpObject);
 
        }

        setFormObject(tmpObject);
        setShouldUpdate(should);
    }

    //This exposes child functions to the parent component using ref
    useImperativeHandle( ref, () => ({
        handleResetFormToDefault: ()=>{
            if(formObject){
                //reset fields to either defaultValue or blank
                for( const ref in ref_object){
                    if(ref_object[ref].current){
                        var field = fields.find((f)=> f.field == ref)
                        switch (field.type){
                            case 'number': 
                                ref_object[ref].current.value = formObject[ref]?.toString() || field?.defaultValue || null;
                            break;
                            default: 
                                ref_object[ref].current.value = formObject[ref] || field?.defaultValue || null;
                            break;
                        }
                        
                    }
                }
            }
            setValidErrorFields([])
            setErrorFields([])
        },
        handleShouldUpdate: (update)=>{
            return new Promise((resolve,reject)=>{
                
                handleShouldUpdate(update)
                resolve(true);
                
            })
            
        },
        handleSaveParent: (itemToSave, event, add_and_continue) =>{
            if(event){
                console.log("Prevent default");
                event.preventDefault();
            }
            
            var addOrEdit = mode;

            console.log("itemToSave",itemToSave);
            if(!itemToSave && addOrEdit === "edit"){
                console.error("Bad itemToSave")
                cogoToast.error("Internal Server Error")
                return;
            }
            
            if(shouldUpdate){
                //Create Object with our text input values using ref_object
                const objectMap = (obj, fn) =>
                Object.fromEntries(      Object.entries(obj).map( ([k, v], i) => [k, fn(v, k, i)]  )        );
                var textValueObject = objectMap(ref_object, v => v.current ? v.current.value || v.current.value === "" ? v.current.value : null : null );

                console.log("textValueObject", textValueObject);
                
                var updateItem = {...itemToSave};

                //Get only values we need to updateTask()
                fields.forEach((field, i)=>{
                    const type = field.type;
                    switch(type){
                        case 'number':
                            if(textValueObject[field.field])
                            updateItem[field.field] = textValueObject[field.field];
                        break;
                        case 'text':
                            //Get updated values with textValueObject bc text values use ref, check against "" bc ""==false
                            if(textValueObject[field.field]){
                                updateItem[field.field] = textValueObject[field.field];
                            }
                            if(textValueObject[field.field]=== ""){
                                //set to null when clearing out text fields and saving
                                updateItem[field.field] = null;
                            }
                            break;
                        case 'date':
                            if(textValueObject[field.field])
                                updateItem[field.field] = Util.convertISODateToMySqlDate(textValueObject[field.field]);
                            break;
                        case 'datetime':
                            if(textValueObject[field.field])
                                updateItem[field.field] = Util.convertISODateTimeToMySqlDateTime(textValueObject[field.field]);
                            break;
                        // case 'auto':
                        //     //Auto doesnt usually use ref but leaving in case we need to switch from state
                        //     //Get updated values with textValueObject bc text values use ref
                        //     if(textValueObject[field.field])
                        //         console.log("TEST",textValueObject[field.field]);
                        //         updateItem[field.field] = textValueObject[field.field];
                        //     break;
                        default:
                            //Others are updated with itemToSave (formObject) state variable
                            if(itemToSave && itemToSave[field.field])
                                updateItem[field.field] = itemToSave[field.field];
                            break;
                    }
                })

                //Validate Required Fields
                var empty_required_fields = fields.
                        filter((v,i)=> v.required && !(v.hidden && v.hidden(formObject) )).
                        filter((item)=> updateItem[item.field] == null || updateItem[item.field] == undefined || updateItem[item.field]=== "");;
                if(empty_required_fields.length > 0){
                    cogoToast.error("Required fields are blank", {hideAfter: 10});
                    setErrorFields(empty_required_fields);
                    return;
                }else{
                    setErrorFields([]);
                }

                const validate_by_type = (field, index) =>{
                    if(!field || !updateItem){
                        //Return true so we dont add error on bad code
                        console.error("Error in validation params; Bad field or updateItem")
                        return true;
                    }
                    var type = field.type;
                    var error = false;

                    switch(type){
                        case 'text':
                            break;
                        case 'number':
                            //test against regexp for nondecimal or decimal 
                            error = updateItem[field.field] && (!(/^\d+$/.test(updateItem[field.field]) || /^(\d{1,8})?(\.\d{1,6})?$/.test(updateItem[field.field])));
                            break;
                        case 'order_kit_select':
                            error = updateItem["kit_items"]?.length > 0 && !(updateItem["kit_items"].filter((item)=> item.selected).every((item)=> { console.log("item", item); return ( item.part_mf_id && item.actual_cost_each && item.rainey_id && item.qty_in_order)} ))
                            break;
                    }
                    return error;
                }

                //Validate Field Data
                var fail_validation_fields = fields.
                        filter((v,i)=> v.type && !(v.hidden && v.hidden(formObject) )).
                        filter( validate_by_type );
                if(fail_validation_fields.length > 0){
                    cogoToast.error("Validation data error on marked fields", {hideAfter: 10});
                    setValidErrorFields(fail_validation_fields);
                    console.error("Validation data error on marked fields", fail_validation_fields)
                    return;
                }else{
                    setValidErrorFields([]);
                }
                console.log("updateItem", updateItem);
                //Run given handlSave
                if(handleSave){
                    handleSave(itemToSave, updateItem, addOrEdit, add_and_continue)
                    .then((data)=>{
                        console.log("Post save function", updateItem.postSaveFunction)
                        if(updateItem.postSaveFunction){
                            updateItem.postSaveFunction(data.data,data?.callback);
                        }
                    })
                    .catch((error)=>{
                        console.error("Failed to save in FormBuilder", error);
                        cogoToast.info("Failed to save in FormBuilde");
                    })
                }

            }else{
                
                if(addOrEdit == "add"){
                    cogoToast.info("Empty Form not allowed");
                }else{
                    cogoToast.info("No Changes made");
                    if(!dontCloseOnNoChangesSave){
                        handleCloseParent();
                    }
                }
                
            }
        }
    }));



    return(<>
        {ref_object  ? <>
            <div className={clsx( {[classes.formColumnStyle]: props.columns })}>
            {fields.map((field, i)=>{
                if(field?.hidden && field.hidden(formObject)){
                    return (<></>);
                }
                return(
                <div key={`${field.field}_div_key`} className={clsx(classes.inputDiv,{[classes.formColumnSeperator]: field?.second_column})}
                    style={field?.second_column ? {gridColumn:'2'} : null}>  
                    { field.label  ? <span className={classes.inputLabel}>{field.label}{field.required ? '*' : ''}</span> : <></>}
                    <GetInputByType key={`${field.field}_key`} field={field} formObject={formObject} setFormObject={setFormObject} errorFields={errorFields} validErrorFields={validErrorFields} handleShouldUpdate={handleShouldUpdate}
                    handleInputOnChange={handleInputOnChange} classes={classes} mode={mode} raineyUsers={raineyUsers} vendorTypes={vendorTypes}
                    shipToContactOptionsWOI={shipToContactOptionsWOI} shipToAddressOptionsWOI={shipToAddressOptionsWOI} scbd_or_sign_radio_options={scbd_or_sign_radio_options}
                    item_type_radio_options={item_type_radio_options} setShouldUpdate={setShouldUpdate} ref_object={ref_object}
                    dataGetterFunc={field.dataGetterFunc} entityTypes={entityTypes} partTypes={partTypes} kitPartsManItems={kitPartsManItems} setKitsPartsManItemsRefetch={setKitsPartsManItemsRefetch}
                     defaultAddresses={defaultAddresses}
                     entContactTitles={entContactTitles} entityShippingContacts={entityShippingContacts} setEntityShippingContacts={setEntityShippingContacts}
                     entityShippingAddresses={entityShippingAddresses} setEntityShippingAddresses={setEntityShippingAddresses}
                     entityBillingContacts={entityBillingContacts} setEntityBillingContacts={setEntityBillingContacts}
                     entityBillingAddresses={entityBillingAddresses} setEntityBillingAddresses={setEntityBillingAddresses} manufacturers={manufacturers} id_pretext={id_pretext}/>
                    {field.addOn ? <div style={{flexBasis: '20%'}}>{field.addOn()}</div> : <></>}
                </div>)
            })}</div></>
        : <></>}
        </>
    )


})
export default FormBuilder;

const GetInputByType = function(props){

    const {field,dataGetterFunc , formObject,setFormObject, errorFields, validErrorFields, handleShouldUpdate, handleInputOnChange, classes, mode, raineyUsers, vendorTypes, id_pretext,
        shipToContactOptionsWOI , shipToAddressOptionsWOI, scbd_or_sign_radio_options, item_type_radio_options, setShouldUpdate, ref_object, entityTypes, partTypes, kitPartsManItems, setKitsPartsManItemsRefetch,
         defaultAddresses,
        entContactTitles, entityShippingContacts, setEntityShippingContacts, entityShippingAddresses, setEntityShippingAddresses,
        entityBillingContacts, setEntityBillingContacts, entityBillingAddresses, setEntityBillingAddresses, manufacturers} = props;

    if(!field || field.type == null){
        console.error("Bad field");
        return;
    }

    var error = errorFields?.filter((v)=> v.field == field.field).length > 0 ? true : false;
    var valid_error = validErrorFields?.filter((v)=> v.field == field.field).length > 0 ? true : false;
    
    switch(field.type){
        case 'text':
            return(<div className={classes.inputValue}>
                <TextField id={`${id_pretext ? id_pretext : 'input'}-${field.field}`} 
                        error={error || valid_error}
                         variant="outlined"
                         multiline={field.multiline}
                         name={field.field}
                         disabled={field.disabled}
                         inputRef={ref_object[field.field]}
                         inputProps={{className: classes.inputStyle}} 
                         classes={{root: classes.inputRoot}}
                         defaultValue={ formObject && formObject[field.field] ? formObject[field.field] : field?.defaultValue  }
                         onChange={()=>handleShouldUpdate(true)}  /></div>
            )
            break;
        case 'number':
            return(<div className={classes.inputValue}>
                <TextField id={`woi_input-${field.field}`} 
                        error={error || valid_error}
                         variant="outlined"
                         /*multiline={field.multiline}*/
                         name={field.field}
                         disabled={field.disabled}
                         inputRef={ref_object[field.field]}
                         inputProps={{className: classes.inputStyle}} 
                         classes={{root: classes.inputRoot}}
                         defaultValue={ formObject && (formObject[field.field] || formObject[field.field] ==0)  ? formObject[field.field] : field?.defaultValue  }
                         onChange={()=>handleShouldUpdate(true)}  /></div>
            )
            break;
        case 'date':
        case 'datetime':
            return(<div className={classes.inputValue}>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <KeyboardDatePicker className={classes.inputStyleDate} 
                                showTodayButton
                                clearable
                                error={error || valid_error}
                                inputVariant="outlined"  
                                disableFuture={field.field == "date" || field.field == "datetime" }
                                onChange={(value, value2)=> {
                                    handleInputOnChange(value, true, field.type, field.field)
                                    
                                }}
                                value={formObject &&  formObject[field.field] ? Util.convertISODateTimeToMySqlDateTime(formObject[field.field]) : null}
                                inputProps={{className: classes.inputRoot}} 
                                format={'M/dd/yyyy'}
                                />
            </MuiPickersUtilsProvider></div>);
            break;
        case 'select-users':
            return(<div className={classes.inputValueSelect}>
                <Select
                    error={error || valid_error}
                    id={`woi_input-${field.field}`}
                    value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                    inputProps={{classes:  classes.inputSelect}}
                    onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                    native
                >
                    <option value={0}>
                        Select
                    </option>
                    {raineyUsers && raineyUsers.map((user)=>{
                        return (
                            <option value={user.user_id}>
                                {user.name}
                            </option>
                        )
                    })}
                </Select></div>
            )
            break;
        case 'select-type':
            return(
                <div className={classes.inputValueSelect}>
                    <Select
                error={error || valid_error}
                    id={`woi_input-${field.field}`}
                    value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                    inputProps={{classes:  classes.inputSelect}}
                    onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                    native
                >
                    <option value={0}>
                        Select
                    </option>
                    { ["Install", "Install (Drill)", "Delivery", "Parts (Mfg.)", "Parts (Service)", "Field", "Loaner", "Shipment", "Bench", "Pickup"].map((type)=>{
                        
                        return (
                            <option value={type}>
                                {type}
                            </option>
                        )
                    })}
                </Select></div>
            )
            break;
            case 'select-entity-type':
                return(
                    <div className={classes.inputValueSelect}>
                        <Select
                    error={error || valid_error}
                        id={`woi_input-${field.field}`}
                        value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                        inputProps={{classes:  classes.inputSelect}}
                        onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                        native
                    >
                        <option value={0}>
                            Select
                        </option>
                        {entityTypes ? entityTypes.map((type)=>{
                            return (
                                <option value={type.record_id}>
                                    {type.name}
                                </option>
                            )
                        }) :  <></>}
                    </Select></div>
                )
                break;
            case 'select-part-type':
                return(
                    <div className={classes.inputValueSelect}>
                        <Select
                    error={error || valid_error}
                        id={field.field}
                        value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                        inputProps={{classes:  classes.inputSelect}}
                        onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                        native
                    >
                        <option value={0}>
                            Select
                        </option>
                        {partTypes ? partTypes.map((type)=>{
                            return (
                                <option value={type.id}>
                                    {type.type}
                                </option>
                            )
                        }) :  <></>}
                    </Select></div>
                )
                break;
            case 'select-default-address':
                return(
                    <div className={classes.inputValueSelect}>
                        <Select
                    error={error || valid_error}
                        id={`woi_input-${field.field}`}
                        value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                        inputProps={{classes:  classes.inputSelect}}
                        onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                        native
                    >
                        <option value={0}>
                            Select
                        </option>
                        {Array.isArray(defaultAddresses) ? defaultAddresses.map((type)=>{
                            
                            return (
                                <option value={type.record_id}>
                                    {type.name} - {type.main ? "*Main " : ""}{type.shipping ? "*Shipping " : ""}{type.billing ? "*Billing " : ""}{type.mailing ? "*Mailing " : ""}
                                </option>
                            )
                        }) :  <></>}
                    </Select></div>
                )
                break;   
        case 'select-vendor':
            return(<div className={classes.inputValueSelect}>
                <Select
                    error={error || valid_error}
                    id={`woi_input-${field.field}`}
                    value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                    inputProps={{classes:  classes.inputSelect}}
                    onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                    native
                >
                    <option value={0}>
                        Select
                    </option>
                    {vendorTypes && vendorTypes.map((item)=>{
                        return (
                            <option value={item.id}>
                                {item.name}
                            </option>
                        )
                    })}
                </Select></div>
            )
            break;
        case 'select-ship_to-contact':
                return(<div className={classes.inputValueSelect}>
                    <Select
                        error={error || valid_error}
                        id={`woi_input-${field.field}`}
                        value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                        inputProps={{classes:  classes.inputSelect}}
                        onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                        native
                    >
                        <option value={0}>
                            Select
                        </option>
                        {shipToContactOptionsWOI && shipToContactOptionsWOI.map((item)=>{
                            return (
                                <option value={item.ec_record_id}>
                                    {item.ec_name}
                                </option>
                            )
                        })}
                    </Select></div>
                )
                break;
        case 'select-ship_to-address':
                return(<div className={classes.inputValueSelect}>
                    <Select
                        error={error || valid_error}
                        id={`woi_input-${field.field}`}
                        value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                        inputProps={{classes:  classes.inputSelect}}
                        onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                        native
                    >
                        <option value={0}>
                            Select
                        </option>
                        {shipToAddressOptionsWOI && shipToAddressOptionsWOI.map((item)=>{
                            return (
                                <option value={item.ea_record_id}>
                                    {item.ea_name}
                                </option>
                            )
                        })}
                    </Select></div>
                )
                break;
        case 'check':
            return(<div className={classes.inputValue}>
                <Checkbox
                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                    name="checkedI"
                    checked={formObject && formObject[field.field] ? formObject[field.field] == 1 ? true : false : false}
                    onChange={(event)=> handleInputOnChange(event.target.checked ? 1 : 0, true, field.type, field.field)}
                /></div>)
            break;
        case 'entity':
            return(<div className={classes.inputValue}>{(error || valid_error) && <span className={classes.errorSpan}>Entity Required</span> }
            {formObject && formObject[field.field] ? <>
                    
                    <span className={classes.inputRoot}>{formObject[field.displayField]} | ID:{formObject[field.field]}</span>
                    
                        </> : <></>}
                <IconButton className={classes.iconButton} aria-label="clear-search" onClick={field.onClick}>
                    <AccountBoxIcon />
                </IconButton> 
                </div>
            )
            break;

        case 'select-entity-contact':
            console.log("formObject", formObject )
                return(<div className={classes.inputValueSelect}>
                    {(error || valid_error) && <span className={classes.errorSpan}>Entity Contact Required</span> }
                    <Select
                        error={error || valid_error}
                        id={`woi_input-${field.field}`}
                        value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                        inputProps={{classes:  classes.inputSelect}}
                        onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                        native
                    >
                        <option value={0}>
                            Select
                        </option>
                        {field.field === "customer_contact_id" ? (entityShippingContacts && entityShippingContacts.map((item)=>{
                            return (
                                <option value={item.record_id}>
                                    {item.name} {item.record_id===item.default_shipping ? "(Default Shipping)" : ""}
                                </option>
                            )
                        }) ) : 
                        field.field === "account_contact_id" ? (entityBillingContacts && entityBillingContacts.map((item)=>{
                            return (
                                <option value={item.record_id}>
                                    {item.name} {item.record_id===item.default_billing ? "(Default Billing)" : ""}
                                </option>
                            )
                        }) ) : <></> }
                        
                    </Select></div>
                )
        break;
        case 'select-entity-address':
            return(<div className={classes.inputValueSelect}>
                {(error || valid_error) && <span className={classes.errorSpan}>Entity Address Required</span> }
                <Select
                    error={error || valid_error}
                    id={`woi_input-${field.field}`}
                    value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                    inputProps={{classes:  classes.inputSelect}}
                    onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                    native
                >
                    <option value={0}>
                        Select
                    </option>
                    {field.field === "customer_address_id" ? (entityShippingAddresses && entityShippingAddresses.map((item)=>{
                        return (
                            <option value={item.record_id}>
                                {item.name} {item.record_id===item.default_shipping ? "(Default Shipping)" : ""}
                            </option>
                        )
                    }) ) :
                    field.field === "account_address_id" ? (entityBillingAddresses && entityBillingAddresses.map((item)=>{
                        return (
                            <option value={item.record_id}>
                                {item.name} {item.record_id===item.default_billing ? "(Default Billing)" : ""}
                            </option>
                        )
                    }) ) : <></>
                }
                </Select></div>
            )
        break;
        case 'radio-scbd_or_sign':
            return(
                <FormControl component="fieldset" classes={{ root: classes.radioFormControl}}>
                    <RadioGroup row 
                                aria-label="Scoreboard/Sign/Other" 
                                name="Scoreboard/Sign/Other" 
                                value={formObject && formObject[field.field] != null ? +formObject[field.field] : 0} 
                                onChange={event => handleInputOnChange(event?.target?.value, true, field.type, field.field)}
                                classes={{root: classes.radioGroup}}>
                                    {scbd_or_sign_radio_options.map((item=>(
                                        <FormControlLabel value={item.value} control={<Radio  classes={{checked: classes.radio }}/>} label={item.displayField} />
                                    )))}
                    </RadioGroup>
                </FormControl>
            )
            break;
        case 'radio-type':
            return(
                <FormControl component="fieldset" classes={{ root: classes.radioFormControl}}>
                    <RadioGroup row 
                                aria-label="Scoreboard/Sign/Other" 
                                name="Scoreboard/Sign/Other" 
                                value={formObject && formObject[field.field] != null ? +formObject[field.field] : 3} 
                                onChange={event => handleInputOnChange(event?.target?.value, true, field.type, field.field)}
                                classes={{root: classes.radioGroup}}>
                                    {item_type_radio_options.map((item=>(
                                        <FormControlLabel value={item.value} control={<Radio classes={{checked: classes.radio }} />} label={item.displayField} />
                                    )))}
                    </RadioGroup>
                </FormControl>
            )
            break;
            case 'entity-titles':
                //titles chooses formObject data if its been altered so we can save, else it uses DB drawn data: entContactTitles
                var titles = formObject[field.field] || (entContactTitles && [...entContactTitles]);

                const handleChangeTitleState = (idToChange, value) =>{
                    var updateTitles = [...titles].map((item)=>{
                        if(idToChange == item.record_id){
                            console.log("Found");
                            item["title_change"] = value;
                        }
                        return item
                    })
                    handleInputOnChange(updateTitles, true, field.type, field.field);
                }
                return(
                    <div className={classes.inputValueSelect}>
                        <div className={classes.titleDiv}>
                        {Array.isArray(titles) ? titles.map((title,i)=>{
                            
                            return (
                                <div key={title.record_id} className={classes.titleRowDiv}>
                                    <span className={classes.titleSpan}>{title.name}</span>
                                    { (title.title_change && title.title_change == "add" ) || (title.title_attached && title.title_change != "remove")  ?
                                                    <span onClick={event=> handleChangeTitleState(title.record_id, "remove")} className={classes.titleButtonSpan}> Remove </span> : 
                                                    <span onClick={event=> handleChangeTitleState(title.record_id, "add")} className={classes.titleButtonSpan}> Add </span>}
                                </div>
                            )
                        }) :  <></>}
                    </div></div>
                )
                break;   
        case 'auto':
            //Auto State
            //const [value, setValue] = useState(formObject[field.field])
            const [options, setOptions ] = useState([]); //options
            const [open, setOpen] = useState(false); //open, setOpen
            const loading = open && options.length === 0;
            

            //Data for autocomplete
            useEffect(()=>{
                let active = true;

                if(!loading){   return undefined;   }

                (async () => {
                    var tmp = await dataGetterFunc();
                    if(active){
                        setOptions(tmp)
                    }
                })();

                return () =>{      active = false;     }

            },[loading])

            useEffect(() => {
                if (!open) {
                setOptions([]);
                }
            }, [open]);

        
            return( 
                <Autocomplete
                id={`woi_input-${field.field}`}
                open={open}
                onOpen={() => {
                    setOpen(true);
                }}
                onClose={() => {
                    setOpen(false);
                }}
                
                options={options}
                loading={loading}
                getOptionLabel={(option) => (option[field.field] || "").toString()}
                freeSolo
                openOnFocus
                className={classes.autocompleteRoot}
                inputValue={ formObject[field.field] || "" }
                classes={{input: classes.actualInputElement, option: classes.optionLi, listbox: classes.optionList }}
                onInputChange={(event, value, reason)=> {
                    //kind of hacked, if value exists as id in searchHistory Array, then use the array value, otherwise use whatevers typed
                    //very low chance user types the id perfectly 
                    console.log("Auto Model Value", value)
                    console.log("Reason", reason);
                    //check against this reset case, bc it will null out the value on edit
                    if(!(reason == "reset" && value == "")){
                        handleInputOnChange(value, true, field.type, field.field)
                        //setValue(value)
                    }
                    
                } }
                renderInput={(params) => { 
                     ref_object[field.field].current = params.inputProps.ref.current; 
                    return (<TextField
                        className={classes.input}   
                         
                        placeholder=""
                        inputProps={{ 'aria-label': `${field.field}`,ref: ref_object[field.field], id: `${field.field}_inputelement`, className: classes.inputStyle}}
                        {...params}
                        InputProps={{...params.InputProps, classes: {underline: classes.underline}, 
                                        endAdornment: (
                                            <React.Fragment>
                                            {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),}}
                        
                        />)}}
                renderOption={(option, state)=> {
                
                return(<div className={classes.optionDiv}>
                    <span className={classes.optionSearchValueSpan}>{option[field.field]}</span>
                    </div>)
                }}
                /> 
            )
            break;
        case "select-manufacturer":
            return(<div className={classes.inputValueSelect}>
                <Select
                    error={error || valid_error}
                    id={`woi_input-${field.field}`}
                    value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                    inputProps={{classes:  classes.inputSelect}}
                    onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                    native
                >
                    <option value={0}>
                        Select
                    </option>
                    {manufacturers && manufacturers.map((item)=>{
                        return (
                            <option value={item.id}>
                                {item.name}
                            </option>
                        )
                    })}
                </Select></div>
            )
            break;
        default: 
            return <></>
            break;
    }
}
