import React = require('react')
import ReactDOM = require('react-dom')


interface TrackMoverProps extends React.Props<Resizer> {
    trackName: string,
    move(pageX: number): void,
    startMove(pageX: number): void
}

interface TrackMoverState {
    startx: number
}

interface CustomDragEvent extends DragEvent {
    dataTransfer: CustomDataTransfer;
}

interface CustomDataTransfer extends DataTransfer {
    setDragImage(image: Element, x: number, y: number):any
}

export default class Resizer extends React.Component<TrackMoverProps, TrackMoverState> {

    proxyImg: HTMLImageElement;

    constructor(props) {
        super(props);
        this.state = {startx:0}
    }

    onDragStart(e: CustomDragEvent) {
        this.props.startMove(e.pageX);
        
        // create phantom drag image to remove drag proxy shadow
        this.proxyImg = document.createElement("img");
        this.proxyImg.src = '../images/checker.png';
        this.proxyImg.style.visibility = "hidden";
        this.proxyImg.style.opacity = "0";
        this.proxyImg.style.display = "none"; // or visibility: hidden, or any of the above 
        document.body.appendChild(this.proxyImg);
        e.dataTransfer.setDragImage(this.proxyImg, 0, 0);
    }

    onDrag(e: DragEvent) {
        // final ondrag event before ondragend gives e.pageX=0 for reasons unknown!
        if (e.pageX !== 0) { 
            this.props.move(e.pageX);
        }
    }

    onDragEnd(e: DragEvent) {
        document.body.removeChild(this.proxyImg);
    }

    render() {
        return  <div className='trackMover' draggable={true} 
                    onDragStart={this.onDragStart.bind(this)}
                    onDrag={this.onDrag.bind(this)}
                    onDragEnd={this.onDragEnd.bind(this)} 
                    >
                    {this.props.trackName}
                </div>;
    }
}



