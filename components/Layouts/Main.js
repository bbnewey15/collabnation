import Head from 'next/head'
import Wrapper from './Wrapper'
import Nav from '../Nav';
import StyledFooter from '../Footer'
import navButtons from "../../config/buttons";

import {makeStyles } from '@material-ui/core/styles';

import {styled} from '@material-ui/core/styles';

const StyledNav = styled(Nav)({
  display: 'flex',
  background: '#414d5a',
});




const Layout = (props) => {

      const {children} = props;
      const title = "Collab-Nation";
      //CSS
      const classes = useStyles();

      return (
        <Wrapper>
          <Head>
            <title>{title}</title>
            
          </Head>
          <main className='main-wrapper'>
            { children }
            {/* <style jsx>{`
                margin: 0% 3% 1% 3%
            `}</style> */}
          </main>
          <StyledFooter />
          
        </Wrapper>
    );
  }

  export default Layout;


const useStyles = makeStyles(theme => ({
  root:{

  }
}));
