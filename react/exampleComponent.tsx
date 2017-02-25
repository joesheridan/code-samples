/// <reference path="../../typings/react/react.d.ts" />
/// <reference path="../../typings/react/react-dom.d.ts" />

import React = require('react')
import ReactDOM = require('react-dom')

import TrackInfo from './trackinfo.component';
import AuditionSlider from './auditionslider.component';

interface DataPoint {
    v: number,
    ts: number
}

interface AuditionProps {
    currentTs: number
}

export default class Audition extends React.Component<any, any> {
    
    constructor(props) {
        super(props)
    }

    getAuditionVal(data, currentTs, type): number {
        // find out which two points are either side of the currentts marker
        // then calculate a linear path to get val
        let points = data.automations[type] as DataPoint[];
        let left = this.findNearestLeftPoint(points, currentTs);
        let right = this.findNearestRightPoint(points, currentTs);
        let heightdiff = right.v - left.v;
        let tsdiff = right.ts - left.ts;

        // calculate portion of heightdiff to add to left point
        let h = ((currentTs-left.ts) / tsdiff) * heightdiff;
        let val = (left.v + h) / 2;

        return val;
    }

    findNearestLeftPoint(points: DataPoint[], currentTs): DataPoint {
        let startPoint = points[0];
        let left = _.reduce(points, (acc, point, index) => {
            // if the point ts is lower than the currentts but higher than the current acc value, 
            // make it the current accumulator val 
            if (point.ts < currentTs && point.ts > acc.ts) {
                return point;
            }
            return acc;
        }, startPoint);

        return left;
    }

    findNearestRightPoint(points: DataPoint[], currentTs: number): DataPoint {
        let startPoint = _.last(points);
        let right = _.reduce(points, (acc, point, index) => {
            // if the point ts is higher than the currentts but lower than the current acc value, 
            // make it the current accumulator val 
            if (point.ts > currentTs && point.ts < acc.ts) {
                return point;
            }
            return acc;
        }, startPoint);

        return right;
    }

    render() {
        let momentum = this.getAuditionVal(this.props.data, this.props.currentTs, 'A');
        let depth = this.getAuditionVal(this.props.data, this.props.currentTs, 'B');
        let power = this.getAuditionVal(this.props.data, this.props.currentTs, 'C');
        let auditionMode = this.props.auditionMode;
        let currenttheme = this.props.currentThemePlaying;
        let playing = this.props.themePlaying;
        if (auditionMode) {

        }
        //console.log('rendering audition component, momentum:', momentum);

        return <div className='auditionpane'>
                    <div id="heading">
                        <img className='auditionIcon' src='img/sample@2x.png' /><h1>AUDITION</h1>
                    </div>
                    <TrackInfo theme={this.props.selectedTheme} />
                    <div className='slidercontrols'>
                        <AuditionSlider initialPos={.35} automationsVal={ momentum } controlType='momentum' 
                        currentTs={this.props.currentTs} auditionMode={auditionMode} theme={currenttheme} themePlaying={playing} 
                        videoPlaying={this.props.videoPlaying} />
                        <AuditionSlider initialPos={.25} automationsVal={ depth } controlType='depth' 
                        currentTs={this.props.currentTs} auditionMode={auditionMode} theme={currenttheme} themePlaying={playing}
                        videoPlaying={this.props.videoPlaying} />
                        <AuditionSlider initialPos={.65} automationsVal={ power } controlType='power' 
                        currentTs={this.props.currentTs} auditionMode={auditionMode} theme={currenttheme} themePlaying={playing}
                        videoPlaying={this.props.videoPlaying} />
                    </div>
                </div>;
    }
}



