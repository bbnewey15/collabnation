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

import Settings from  '../../../js/Settings';
import Entities from  '../../../js/Entities';
import { ListContext } from '../../../components/WorkOrders/WOContainer';
import { DetailContext } from '../../../components/WorkOrders/WOContainer';

const FormBuilder = forwardRef((props, ref) => {
    const { fields, //table of each input field
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
            shipToOptionsWOI, //specific data for woi ship_to
            vendorTypes, //specific data for woi vendor
            raineyUsers //specific data for all select-users
        } = props;
        console.log("Props", props);
        
    const [shouldUpdate, setShouldUpdate] = useState(false);
    const [errorFields,setErrorFields] = useState([]);

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

        if(type === "date") {
            tmpObject[key] = value ? Util.convertISODateTimeToMySqlDateTime(value) : value;
        }
        if(type.split('-')[0] === "select"){
            tmpObject[key] = value.target.value;
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
                        ref_object[ref].current.value = formObject[ref] || fields.find((f)=> f.field == ref)?.defaultValue || null
                    }
                }
            }
        },
        handleShouldUpdate: (update)=>{
            handleShouldUpdate(update)
        },
        handleSaveParent: (itemToSave) =>{
            if(!itemToSave){
                console.error("Bad itemToSave")
                return;
            }
            var addOrEdit = mode;
            
            if(shouldUpdate){
                //Create Object with our text input values using ref_object
                const objectMap = (obj, fn) =>
                Object.fromEntries(      Object.entries(obj).map( ([k, v], i) => [k, fn(v, k, i)]  )        );
                var textValueObject = objectMap(ref_object, v => v.current ? v.current.value ? v.current.value : null : null );

                var updateItem = {...itemToSave};

                
                //Get only values we need to updateTask()
                fields.forEach((field, i)=>{
                    const type = field.type;
                    switch(type){
                        case 'number':
                        case 'text':
                            //Get updated values with textValueObject bc text values use ref
                            if(textValueObject[field.field])
                                updateItem[field.field] = textValueObject[field.field];
                            break;
                        case 'date':
                            if(textValueObject[field.field])
                                updateItem[field.field] = Util.convertISODateToMySqlDate(textValueObject[field.field]);
                            break;
                        // case 'auto':
                        //     //Auto doesnt usually use ref but leaving in case we need to switch from state
                        //     //Get updated values with textValueObject bc text values use ref
                        //     if(textValueObject[field.field])
                        //         console.log("TEST",textValueObject[field.field]);
                        //         updateItem[field.field] = textValueObject[field.field];
                        //     break;
                        case 'entity-titles':
                            const saveEntity = (data, callback) => {
                                
                                itemToSave[field.field]?.forEach((title)=>{
                                    //Remove titles if false
                                    if(title.title_change && title.title_change == "remove"){
                                        if(title?.title_attached != 0){
                                            //Delete from entities_contacts_titles
                                            Entities.deleteContactTitle(title.title_attached)
                                            .then((data)=>{
                                                console.log("Deleted title", title.title_attached)
                                                if(callback){
                                                    callback()
                                                }
                                            })
                                            .catch((error)=>{
                                                console.error("Failed to delete contact title")
                                                cogoToast.error("Internal Server Error");
                                                if(callback){
                                                    callback()
                                                }
                                            })
                                        }
                                    }
                                    if(title.title_change && title.title_change == "add"){
                                        //check against original DB data to see if we really need to add
                                        var updatedTitle = {...title};
                                        if(addOrEdit == "add"){
                                            updatedTitle["contact_id"] = data.insertId;
                                        }else{
                                            updatedTitle["contact_id"] = itemToSave["record_id"];
                                        }
                                        
                                        if(title?.title_attached == 0){
                                            //Add to entities_contacts_titles
                                            Entities.addContactTitle( updatedTitle )
                                            .then((data)=>{
                                                if(callback){
                                                    callback()
                                                }
                                            })
                                            .catch((error)=>{
                                                console.error("Failed to delete contact title")
                                                cogoToast.error("Internal Server Error");
                                                if(callback){
                                                    callback()
                                                }
                                            })
                                        }
                                    }
                             
                                })
                            }
                            //saving the save function so that we can run after entity contact is inserted so we can get contact_id
                            updateItem["postSaveFunction"] = saveEntity;
                            
                            break;
                        default:
                            //Others are updated with itemToSave (formObject) state variable
                            if(itemToSave[field.field])
                                updateItem[field.field] = itemToSave[field.field];
                            break;
                    }
                })

                

                //Validate Required Fields
                var empty_required_fields = fields.
                        filter((v,i)=> v.required && !(v.hidden && v.hidden(formObject) )).
                        filter((item)=> updateItem[item.field] == null || updateItem[item.field] == undefined);;
                if(empty_required_fields.length > 0){
                    cogoToast.error("Required fields are blank");
                    setErrorFields(empty_required_fields);
                    console.error("Required fields are blank", empty_required_fields)
                    return;
                }

                //Run given handlSave
                if(handleSave){
                    handleSave(itemToSave, updateItem, addOrEdit)
                    .then((data)=>{
                        if(updateItem.postSaveFunction){
                            updateItem.postSaveFunction(data.data,data?.callback);
                        }
                    })
                    .catch((error)=>{
                        console.log("Failed to save in FormBuilder", error);
                        cogoToast.error("Internal server error");
                    })
                }

            }else{
                
                if(addOrEdit == "add"){
                    cogoToast.info("Empty Form not allowed");
                }else{
                    cogoToast.info("No Changes made");
                    handleCloseParent();
                }
                
            }
        }
    }));

    return(<>
        {ref_object  ? <>
            {fields.map((field, i)=>{
                if(field?.hidden && field.hidden(formObject)){
                    return (<></>);
                }
                return(
                <div className={classes.inputDiv}>  
                    <span className={classes.inputLabel}>{field.label}</span>
                    <GetInputByType field={field} formObject={formObject} errorFields={errorFields} handleShouldUpdate={handleShouldUpdate}
                    handleInputOnChange={handleInputOnChange} classes={classes} raineyUsers={raineyUsers} vendorTypes={vendorTypes}
                    shipToOptionsWOI={shipToOptionsWOI} scbd_or_sign_radio_options={scbd_or_sign_radio_options}
                    item_type_radio_options={item_type_radio_options} setShouldUpdate={setShouldUpdate} ref_object={ref_object}
                    dataGetterFunc={field.dataGetterFunc} entityTypes={entityTypes} defaultAddresses={defaultAddresses}
                     entContactTitles={entContactTitles}/>
                </div>)
            })}</>
        : <></>}
        </>
    )


})
export default FormBuilder;

const GetInputByType = function(props){
    const {field,dataGetterFunc , formObject, errorFields, handleShouldUpdate, handleInputOnChange, classes, raineyUsers, vendorTypes,
        shipToOptionsWOI , scbd_or_sign_radio_options, item_type_radio_options, setShouldUpdate, ref_object, entityTypes, defaultAddresses,
        entContactTitles} = props;

    if(!field || field.type == null){
        console.error("Bad field");
        return;
    }
    
    var error = errorFields?.filter((v)=> v.field == field.field).length > 0 ? true : false;
    
    switch(field.type){
        case 'text':
        case 'number':
            return(<div className={classes.inputValue}>
                <TextField id={field.field} 
                        error={error}
                         variant="outlined"
                         multiline={field.multiline}
                         inputRef={ref_object[field.field]}
                         inputProps={{className: classes.inputStyle}} 
                         classes={{root: classes.inputRoot}}
                         defaultValue={ formObject && formObject[field.field] ? formObject[field.field] : field?.defaultValue  }
                         onChange={()=>handleShouldUpdate(true)}  /></div>
            )
            break;
        case 'date':
            return(<div className={classes.inputValue}>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <KeyboardDatePicker className={classes.inputStyleDate} 
                                showTodayButton
                                clearable
                                error={error}
                                inputVariant="outlined"  
                                disableFuture={field.field == "date" }
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
                    error={error}
                    id={field.field}
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
                error={error}
                    id={field.field}
                    value={formObject && formObject[field.field] ? formObject[field.field] : 0}
                    inputProps={{classes:  classes.inputSelect}}
                    onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                    native
                >
                    <option value={0}>
                        Select
                    </option>
                    {["Install", "Delivery", "Parts", "Field", "Loaner", "Shipment", "Bench", "Pickup"] ? ["Install", "Delivery", "Parts", "Field", "Loaner", "Shipment", "Bench", "Pickup"].map((type)=>{
                        
                        return (
                            <option value={type}>
                                {type}
                            </option>
                        )
                    }) :  <></>}
                </Select></div>
            )
            break;
            case 'select-entity-type':
                return(
                    <div className={classes.inputValueSelect}>
                        <Select
                    error={error}
                        id={field.field}
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
            case 'select-default-address':
                return(
                    <div className={classes.inputValueSelect}>
                        <Select
                    error={error}
                        id={field.field}
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
                    error={error}
                    id={field.field}
                    value={formObject && formObject[field.field] ? formObject[field.field] : null}
                    inputProps={{classes:  classes.inputSelect}}
                    onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                    native
                >
                    <option value={null}>
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
        case 'select-ship_to':
                return(<div className={classes.inputValueSelect}>
                    <Select
                        error={error}
                        id={field.field}
                        value={formObject && formObject[field.field] ? formObject[field.field] : null}
                        inputProps={{classes:  classes.inputSelect}}
                        onChange={value => handleInputOnChange(value, true, field.type, field.field)}
                        native
                    >
                        <option value={null}>
                            Select
                        </option>
                        {shipToOptionsWOI && shipToOptionsWOI.map((item)=>{
                            return (
                                <option value={item.ec_record_id}>
                                    {item.ec_name}
                                </option>
                            )
                        })}
                    </Select></div>
                )
                break;
        case 'check':
            return(
                <div className={classes.inputValue}>
                <Checkbox
                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                    name="checkedI"
                    checked={formObject && formObject[field.field] ? formObject[field.field] == 1 ? true : false : false}
                    onChange={(event)=> handleInputOnChange(event.target.checked ? 1 : 0, true, field.type, field.field)}
                /></div>
            )
            break;
        case 'entity':
            return(<div className={classes.inputValue}>{error && <span className={classes.errorSpan}>Entity Required</span> }
            {formObject && formObject[field.field] ? <>
                    
                    <span className={classes.inputRoot}>{formObject[field.displayField]} | ID:{formObject[field.field]}</span>
                    
                        </> : <></>}
                <IconButton type="submit" className={classes.iconButton} aria-label="clear-search" onClick={field.onClick}>
                    <AccountBoxIcon />
                </IconButton> 
                </div>
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
                id={field.field + "_autoinput"}
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
                        inputProps={{ 'aria-label': `${field.field}`,ref: ref_object[field.field], id: `${field.field}_inputelement`}}
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
        default: 
            return <></>
            break;
    }
}