
//import { Map, GoogleApiWrapper, Marker, InfoWindow } from 'google-maps-react';

import {makeStyles, Paper, Grid, Button} from '@material-ui/core';
import ActiveVehicleIcon from '@material-ui/icons/PlayArrow';
import StoppedVehicleIcon from '@material-ui/icons/Stop';
import MapSidebar from './MapSidebar/MapSidebar';
import CustomMap from './Map';
import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import moment from 'moment';

const fetch = require("isomorphic-fetch");
const { compose, withProps, withHandlers } = require("recompose");
const {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
} = require("react-google-maps");
const { MarkerClusterer } = require("react-google-maps/lib/components/addons/MarkerClusterer");
const { MarkerWithLabel } = require("react-google-maps/lib/components/addons/MarkerWithLabel");

import cogoToast from 'cogo-toast';
import MapMarkerInfoWindow from './MapMarkerInfoWindow';
import MapVehicleInfoWindow from './MapVehicleInfoWindow';

import Tasks from '../../../js/Tasks';
import Crew from '../../../js/Crew';
import TaskLists from '../../../js/TaskLists';
import Util from '../../../js/Util';
import Vehicles from '../../../js/Vehicles';
import TaskListFilter from '../TaskList/TaskListFilter';
import { TaskContext } from '../TaskContainer';
import { confirmAlert } from 'react-confirm-alert'; // Import
import ConfirmYesNo from '../../UI/ConfirmYesNo';

import {createFilter} from '../../../js/Filter';
import {createSorter} from '../../../js/Sort';
import { use } from 'passport';
import { CrewContext } from '../Crew/CrewContextContainer';

const useStyles = makeStyles(theme => ({
    root: {

    },
    map:{
    },
    infoWindow: {
      backgroundColor: '#000'
    },
    mainContainer:{
    }
  }));

const MapContainer = (props) => {
    const classes = useStyles();

    //const {} = props;

    const { modalOpen, setModalOpen, setModalTaskId, taskLists, setTaskLists, taskListToMap, setTaskListToMap, crewToMap, setCrewToMap,
          filters, setFilter, sorters, setSorters, filterInOrOut, filterAndOr, setTaskListTasksSaved, refreshView} = useContext(TaskContext);
    const { crewJobDateRange, setShouldResetCrewState} = useContext(CrewContext);
    const [showingInfoWindow, setShowingInfoWindow] = useState(false);
    const [activeMarker, setActiveMarker] = useState(null);
    const markerTypes = ["task", "vehicle", "crew"];

    const [bounds, setBounds] = useState(null);
    
    const [mapRows, setMapRows] = useState(null); 
    const [mapRowsRefetch, setMapRowsRefetch] = useState(false);
    const [resetBounds, setResetBounds] = React.useState(true);
    const [markedRows, setMarkedRows] = useState([]);
    const [noMarkerRows, setNoMarkerRows] = useState(null);
    const [multipleMarkersOneLocation,setMultipleMarkersOneLocation ] = React.useState(null);
    
    const [infoWeather, setInfoWeather] = useState(null);


    //Vehicle
    const [vehicleRows, setVehicleRows] = useState(null);
    const [vehicleNeedsRefresh, setVehicleNeedsRefresh] = useState(true);
    const [bouncieAuthNeeded,setBouncieAuthNeeded] = useState(false);
    const [visibleItems, setVisibleItems] = React.useState(() => ['tasks' ,'vehicles']);

    //Crew
    //const [localCrewJobs, setLocalCrewJobs] = useState(null);
    const [crewJobs, setCrewJobs] = useState(null);
    const [crewJobsRefetch, setCrewJobsRefetch] = useState(false);
    const [unfilteredJobs, setUnfilteredJobs] = useState(null);
    const [showCompletedJobs, setShowCompletedJobs] = React.useState(false);


    const [mapHeight,setMapHeight] = useState('400px');

    //Radar
    const [radarControl, setRadarControl] = useState(null);
    const [timestamps,setTimestamps] =React.useState([]);
    const [radarOpacity, setRadarOpacity] = React.useState(.5);
    const [radarSpeed, setRadarSpeed] = React.useState(400);
    const [visualTimestamp, setVisualTimestamp] = useState(null);

    //Refresh state for components outside scope
    useEffect(()=>{
      if(refreshView && refreshView == "map"){
          setMapRowsRefetch(true);
          //setShouldResetCrewState(true);
          setCrewJobsRefetch(true);
          //setUnfilteredJobs(null);
      }
    },[refreshView])

    //useEffect for vehicleRows
    useEffect(()=>{
      if(vehicleNeedsRefresh == true){
        var locations = [];
        //Get all vehicle locations and combine into vehicleRows
        Promise.all([Vehicles.getLinxupLocations(), Vehicles.getBouncieLocations()])
        .then((values)=>{
          console.log("valuies",values);
          let linuxp_loc_array = values[0]["data"]["locations"];
          let tmpData = linuxp_loc_array.map((item,i )=> (
                                                { latitude: item.latitude, 
                                                  longitude: item.longitude, 
                                                  make: item.make, 
                                                  model: item.model, 
                                                  name: item.firstName+' '+item.lastName,
                                                  vin: item.vin,
                                                  service: 'linxup',
                                                  active: item.speed > 0 ? true : false,
                                                  direction:  item.direction }))
          locations.splice(locations.length, 0, ...tmpData);
          let tmpData2 =[];
          if(values[1]["error"] || !Array.isArray(values[1])){
            console.error("Custom Error from bouncie", values[1]);
            setBouncieAuthNeeded(true);
          }else{
            tmpData2 =  values[1].map((item,i )=> ({latitude: item['stats']['location'].lat, 
                      longitude: item['stats']['location'].lon, 
                      make: item['model'].make, 
                      model: item['model'].name, 
                      name: item.nickName,
                      vin: item.vin,
                      service: 'bouncie',
                      active: item['stats'].isRunning,
                      direction: item['stats']['location'].heading }))
          }
           
          locations.splice(locations.length, 0, ...tmpData2);
          setVehicleRows(locations);
          setVehicleNeedsRefresh(false);
          console.log(locations);

          //Move our info window by resetting activeVehicle with update info
          if(activeMarker?.type === "vehicle" && activeMarker?.item){
            var refreshedActive = locations.filter((v, i)=> v.vin == activeMarker.item.vin)[0];
            setActiveMarker({type: 'vehicle', item: refreshedActive});
          }
        })
        .catch((error)=>{
          console.error("Vehicle error", error);
        })
      }
    },[vehicleNeedsRefresh]);

    
    //Refetches vehicle Rows every 30 seconds
    useEffect(()=>{
      const timeoutId = setTimeout(()=>{
        setVehicleNeedsRefresh(true);

      }, 30000)
      return () => clearTimeout(timeoutId);
    }, [vehicleRows])

    //useEffect for mapRows
    useEffect( () =>{ 
      if( (mapRows == null || mapRowsRefetch == true) && filterInOrOut != null && filterAndOr != null){
          if(taskLists && taskListToMap && taskListToMap.id ) { 
            if(mapRowsRefetch == true){
              setMapRowsRefetch(false);
            }

            TaskLists.getTaskList(taskListToMap.id)
            .then( (data) => {
                if(!Array.isArray(data)){
                    console.error("Bad tasklist data",data);
                    return;
                }
                var tmpData = [];

                if(filters && filters.length > 0){
                  //If more than one property is set, we need to filter seperately
                  let properties = new Set([...filters].map((v,i)=>v.property));
                  
                  properties.forEach((index,property)=>{
                    
                    let tmpFilter = filters.filter((v,i)=> v.property == property);
                    let tmpTmpData;

                    //On or use taskListTasksSaved to filter from to add to 
                    if((filterAndOr == "or" && filterInOrOut == "in") || (filterAndOr == "and" && filterInOrOut == "out") ){
                        if(tmpFilter.length > 1){
                            //Always use 'or' on same property
                            tmpTmpData = data.filter(createFilter([...tmpFilter], filterInOrOut, "or"));
                        }
                        if(tmpFilter.length <= 1){
                            tmpTmpData = data.filter(createFilter([...tmpFilter], filterInOrOut, "or"));
                            //console.log("MapContainer tmpData in loop", tmpData);
                        }
                        //Add to our big array
                        tmpData.splice(tmpData.length, 0, ...tmpTmpData);
                        //Remove duplicates
                        tmpData.splice(0, tmpData.length, ...(new Set(tmpData)));
                    }

                    //On and use tmpData to filter from
                    if((filterAndOr == "and" && filterInOrOut == "in") || (filterAndOr == "or" && filterInOrOut == "out")){
                        if(tmpData.length <= 0){
                          tmpData = [...data];
                        }  
                        if(tmpFilter.length > 1){
                            //Always use 'or' on same property
                            tmpData = tmpData.filter(createFilter([...tmpFilter], filterInOrOut, "or"));
                        }
                        if(tmpFilter.length <= 1){
                            tmpData = tmpData.filter(createFilter([...tmpFilter], filterInOrOut, "or"));
                            console.log("MapContainer tmpData in loop", tmpData);
                        }
                    }
                    
                    console.log("TaskListFilter each loop, ",tmpData);
                  })              
                }else{
                  console.log("else on filters && filters.length > 0")
                }
                
                setTaskListTasksSaved(data);
                //No filters 
                if(filters && !filters.length){
                  //no change to tmpData
                  tmpData = [...data];
                }

                //SORT after filters -------------------------------------------------------------------------
                if(sorters && sorters.length > 0){
                  tmpData = tmpData.sort(createSorter(...sorters))
                  //Set saved for filter list 
                  //setTaskListTasksSaved(data);
                }
                //--------------------------------------------------------------------------------------------

                //Set TaskListTasks
                if(Array.isArray(tmpData)){
                    setMapRows(tmpData);
                }

            })
            .catch( error => {
                cogoToast.error(`Error getting Task List`, {hideAfter: 4});
                console.error("Error getting tasklist", error);
            })
        }else{
          console.log("else on taskLists && taskListToMap && taskListToMap.id ");
        }
      }else{
        console.log("else on mapRows == null && filterInOrOut != null && filterAndOr != null")
      }
      if(mapRows){
        //filter geocoded, then sort by priority_order
        var tmp = mapRows.filter((row, index) => row.geocoded)
        /*.sort((a,b)=>{
          if(a.priority_order > b.priority_order) return 1;
          if(b.priority_order > a.priority_order) return -1;
          return 0; 
        });*/
        setMarkedRows(tmp);
      }

      return () => { //clean up
      }
    },[mapRows,mapRowsRefetch, filterInOrOut, filterAndOr,taskLists, taskListToMap]);

    //Sort
    useEffect(()=>{
      if (Array.isArray(sorters) && sorters.length) {
          if (mapRows && mapRows.length) {
              var tmpData = mapRows.sort(createSorter(...sorters))
              console.log(tmpData);
              var copyObject = [...tmpData];
              setMapRows(copyObject);
              cogoToast.success(`Sorting by ${sorters.map((v, i)=> v.property + ", ")}`);
          }
      }
    },[sorters]);

    //Use effect for tasks with no locations (nomarkerrows)
    useEffect(()=>{
        if(noMarkerRows == null && mapRows){
           setNoMarkerRows(mapRows.filter((row, index) => !row.geocoded));
        }
        //Find and set geolocation of unset rows
        if(noMarkerRows && noMarkerRows.length > 0 && mapRows){
          console.log("noMarkerRows in if");
          var tmpMapRows = [...mapRows];
          noMarkerRows.forEach((row, i)=> {
            if(!row.address){
              return;
            }
                
            Tasks.getCoordinates(row.address, row.city, row.state, row.zip)
            .then((data)=>{
              if(!data){
                throw new Error("Bad return from getCoordinates from GoogleAPI");
              }
              //Update MapRows with lat, lng, geocoded instead of refreshing
              var mapRowIndex = mapRows.indexOf(row)
              var tmpRow = {...row};
              
              tmpRow["lat"] = data.lat;
              tmpRow["lng"] = data.lng;
              tmpRow["geocoded"] = 1;
              tmpMapRows[mapRowIndex] = tmpRow;
              setMapRows(tmpMapRows);
              setNoMarkerRows(tmpMapRows.filter((row, index) => !row.geocoded));
              //Save lat, lng, geocoded to db
              Tasks.saveCoordinates(row.address_id, data)
              .then((ok)=>{
                if(!ok){
                  console.warn("Did not save coordinates.");
                }
                if(i == noMarkerRows.length){
                  cogoToast.info('Unmapped Markers have been added to map', {hideAfter: 4});
                }     
              })
              .catch((error)=> {
                console.error(error);
                cogoToast.error(`Error Saving Coordinates`, {hideAfter: 4});
                setNoMarkerRows([]);
              })
            })
            .catch((error)=> {
              console.error(error);
              cogoToast.error(`Error getting coordinates`, {hideAfter: 4});
              setNoMarkerRows([]);
            })
          })
          
        }
    }, [noMarkerRows, mapRows])

    useEffect(()=>{
      if(crewToMap && (crewJobs == null || crewJobsRefetch == true)){
          if(crewJobsRefetch == true){
            setCrewJobsRefetch(false);
          }

          Crew.getCrewJobsByCrew(crewToMap.id)
          .then((data)=>{
              if(data){
                  //filter using to and from dates
                  var updateData = data.filter((j)=>j.completed == 0)
                  if(crewJobDateRange){
                      updateData = updateData.filter((job,i)=>{
                          var date;
                          if(job.job_type == "install"){
                              date = Util.convertISODateToMySqlDate(job.sch_install_date) || null;
                          }
                          if(job.job_type == "drill"){
                              date = Util.convertISODateToMySqlDate(job.drill_date) || null;
                          }
  
                          if(date != null){
                              return moment(date).isAfter( moment(Util.convertISODateToMySqlDate(crewJobDateRange.from)).subtract(1, 'days')) && moment(date).isBefore( moment(Util.convertISODateToMySqlDate(crewJobDateRange.to)).add(1,'days'))
                          }else{
                              //Date not assigned
                              return true
                          }
                      })
                  }
                  setUnfilteredJobs([...data]);
                  setCrewJobs( updateData);
              }
          })
          .catch((error)=>{
              console.error("Error getting crewJobs", error);
              cogoToast.error("Failed to get crew jobs");
          })
      }
  
    },[ crewJobs, crewJobsRefetch, crewToMap])
    
    const updateActiveMarker = (id, type) => (props, marker, e) =>{
      var item;
      if(type === "task"){
        item = mapRows.filter((row, i) => row.t_id === id)[0];
      }
      if(type === "vehicle"){
        item = vehicleRows.filter((row, i) => row.vin === id)[0];
      }
      if(type === "crew"){
        item = crewJobs.filter((row, i) => row.id === id)[0];
      }

      if(!item){
        console.error("Bad marker type or item not found");
        return
      }else{
        setMultipleMarkersOneLocation(null);
        setActiveMarker({type, item});
        setShowingInfoWindow(true);
      }


    }

    // const updateActiveMarker = (id) => (props, marker, e) => {
    //     var task = mapRows.filter((row, i) => row.t_id === id)[0];
    //     setActiveMarker(task);
    //     setShowingInfoWindow(true);
    //     setActiveVehicle(null);
        
    // }

    // const updateActiveVehicle = id => (props, marker, e) => {
    //   var vehicle = vehicleRows.filter((row, i) => row.vin === id)[0];
    //   setActiveVehicle(vehicle);
    //   setShowingInfoWindow(true);
    //   setActiveMarker(null)
    // }

    ////
    const handleFindVehicleIcon = (vehicle)=>{
      if(!vehicle){
        console.error("Bad vehilce for handleFindVehcileIcon");
        return
      }
      let selected = false;
      if(activeMarker?.type === "vehicle" && vehicle.vin === activeMarker?.item.vin){
        selected = true;
      }
      let url = "";
      let direction = Util.getDirectionFromDegree(vehicle.direction);
      switch (vehicle.service){
        case 'bouncie':
          // if(selected){
          //   url = vehicle.active ? 'static/vehicle_icons/bouncie_active_selected.png' : 'static/vehicle_icons/bouncie_stop_selected.png';
          // }else{
          //   url = vehicle.active ? 'static/vehicle_icons/bouncie_active_nonselected.png' : 'static/vehicle_icons/bouncie_stop_nonselected.png';
          // }
          url = vehicle.active ?  `static/vehicle_icons/bouncie_active_${direction.toLowerCase()}.png` 
                :   `static/vehicle_icons/bouncie_stop.png`;
          
          break;
        case 'linxup':
          url = vehicle.active ?  `static/vehicle_icons/linxup_active_${direction.toLowerCase()}.png` 
                :   `static/vehicle_icons/linxup_stop.png`;
          break;
      }
      return url;
    }

    const handleFindCrewIcon = (job)=>{
      if(!job){
        console.error("Bad vehilce for handleFindVehcileIcon");
        return
      }
      let selected = false;
      if(activeMarker?.type === "crew" && job.id === activeMarker?.item.id){
        selected = true;
      }
      let url = "";

      if(!job.job_type){
        console.error("No job type ")
        return;
      }

      switch (job.job_type){
        case 'drill':
          url =   `static/crew_icons/drill_marker.png` ;
          
          break;
        case 'install':
          url =   `static/crew_icons/install_marker.png` ;
          break;
      }
      return url;
    }

    return (
      <div>
        <Grid container spacing={1}>
          <Grid item xs={12}>
          <TaskListFilter filteredItems={mapRows}  setFilteredItems={setMapRows}/>
          </Grid>
        </Grid>
          <Grid container spacing={3} className={classes.mainContainer}>
            
            <Grid item xs={12} md={8}>
                <CustomMap taskMarkers={markedRows} setTaskMarkers={setMarkedRows} vehicleMarkers={vehicleRows}
                     crewMarkers={crewJobs} setCrewMarkers={setCrewJobs} 
                     setCrewMarkersRefetch={setCrewJobsRefetch}
                     crewMarkersRefetch={crewJobsRefetch} 
                     visibleItems={visibleItems} 
                      updateActiveMarker={updateActiveMarker} handleFindVehicleIcon={handleFindVehicleIcon}
                      handleFindCrewIcon={handleFindCrewIcon}
                      resetBounds={resetBounds}
                      activeMarker={activeMarker} setActiveMarker={setActiveMarker} 
                      
                      setInfoWeather={setInfoWeather} infoWeather={infoWeather}
                      showingInfoWindow={showingInfoWindow} setShowingInfoWindow={setShowingInfoWindow}
                      bouncieAuthNeeded={bouncieAuthNeeded} setBouncieAuthNeeded={setBouncieAuthNeeded}
                      setMapRows={setMapRows} mapRows={mapRows}
                      
                      setMapRowsRefetch={setMapRowsRefetch}
                      visualTimestamp={visualTimestamp} setVisualTimestamp={setVisualTimestamp}
                      radarControl={radarControl} setRadarControl={setRadarControl}
                      radarOpacity={radarOpacity} setRadarOpacity={setRadarOpacity}
                      radarSpeed={radarSpeed} setRadarSpeed={setRadarSpeed}
                      timestamps={timestamps} setTimestamps={setTimestamps}
                      multipleMarkersOneLocation={multipleMarkersOneLocation} setMultipleMarkersOneLocation={setMultipleMarkersOneLocation}/>
            </Grid>
            <Grid item xs={12} md={4}>
              <MapSidebar mapRows={mapRows} setMapRows={setMapRows} noMarkerRows={noMarkerRows} 
                          setMapRowsRefetch={setMapRowsRefetch}
                          markedRows={markedRows} setMarkedRows={setMarkedRows}
                          vehicleRows={vehicleRows} setVehicleRows={setVehicleRows}
                          activeMarker={activeMarker} setActiveMarker={setActiveMarker}
                          setShowingInfoWindow={setShowingInfoWindow}
                          setModalOpen={setModalOpen} setModalTaskId={setModalTaskId}
                          setResetBounds={setResetBounds}
                          infoWeather={infoWeather} setInfoWeather={setInfoWeather}
                          bouncieAuthNeeded={bouncieAuthNeeded} setBouncieAuthNeeded={setBouncieAuthNeeded}
                          visibleItems={visibleItems} setVisibleItems={setVisibleItems}
                          visualTimestamp={visualTimestamp} setVisualTimestamp={setVisualTimestamp}
                          radarControl={radarControl} setRadarControl={setRadarControl}
                          radarOpacity={radarOpacity} setRadarOpacity={setRadarOpacity}
                          radarSpeed={radarSpeed} setRadarSpeed={setRadarSpeed}
                          timestamps={timestamps} setTimestamps={setTimestamps}
                          multipleMarkersOneLocation={multipleMarkersOneLocation} setMultipleMarkersOneLocation={setMultipleMarkersOneLocation}
                          sorters={sorters} setSorters={setSorters}
                          crewJobs={crewJobs} setCrewJobs={setCrewJobs}
                          crewJobsRefetch={crewJobsRefetch}
                          setCrewJobsRefetch={setCrewJobsRefetch}
                          unfilteredJobs={unfilteredJobs} setUnfilteredJobs={setUnfilteredJobs}
                          crewToMap={crewToMap} setCrewToMap={setCrewToMap}
                          showCompletedJobs={showCompletedJobs} setShowCompletedJobs={setShowCompletedJobs}
                           />
            </Grid>
          </Grid>
        </div>
    );
    }
  

export default MapContainer;
