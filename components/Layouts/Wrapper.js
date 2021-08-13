import { makeStyles } from '@material-ui/core/styles';

const Wrapper = ({children}) => {
  const useStyles = makeStyles(theme => ({
    rootWrapper:  {
      // borderBottom: '1px solid #ddd',
      // backgroundColor: '#e6e6e6',
      // padding: '0%',
    },
  }) );

  const classes = useStyles();
  return (
      <div className={classes.rootWrapper}>{children}</div>
  );
}

export default Wrapper