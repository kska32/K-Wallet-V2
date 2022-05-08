import styled from "styled-components";


export const VisibleStyleComp = styled.div`
    transition: all 0.18s;
    opacity: 0;
    transform: scale(0.9);
    pointer-events: none;
    max-width: 366px;
    max-height: 600px;
    overflow: hidden;
    margin: 20px;
    box-shadow: 2px 2px 3px 2px rgba(0,0,0,0.2);

    ${
        (p) => {
            if(p.visible === true || p.visible === false){
                return `
                    opacity: 1;
                    pointer-events: initial;
                    transform: scale(1);
                    z-index: 300;
                `;
            }
        }
    }

`;