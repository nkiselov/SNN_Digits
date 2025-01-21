//Each layer must
//  run_spk() = return spike output
//  accept_spk(arr) = accept spike input
//  outputs = a list of outgoing connections

class SNN{
    constructor(layers){
        this.layers = layers
    }

    run_step(){
        let spikes = this.layers.map((layer)=>layer.run_spk())
        this.layers.forEach((layer, ind)=>{
            if(layer.outputs)
            layer.outputs.forEach((out)=>{
                out.accept_spk(spikes[ind])
            })
        })
        return spikes
    }
}


class PeriodicFireInput{
    constructor(size){
        this.size = size
        this.fireRates = new Array(size).fill(0)
        this.cooldowns = new Array(size).fill(1)
    }

    setFireRates(rates){
        if(rates.length!=this.size){
            console.error("incorrect input size")
        }
        this.fireRates = rates
    }

    run_spk(){
        let spk = new Array(this.size).fill(0)
        for(let i=0; i<this.size; i++){
            this.cooldowns[i]-=this.fireRates[i]
            if(this.cooldowns[i]<0){
                this.cooldowns[i] = +1
                spk[i] = 1
            }
        }
        return spk
    }
}

class LIFLayer{
    constructor(synapses, size, tau, vrest, vt){
        this.synapses = synapses
        this.size = size
        this.volts = new Array(size).fill(0)
        this.tau = tau
        this.vrest = vrest
        this.vt = vt
    }

    run_spk(){
        for(let s=0; s<this.synapses.length; s++){
            let syn = this.synapses[s]
            for(let i=0; i<this.size; i++){
                this.volts[i]+=(syn.flows[i]*(syn.eqv-this.volts[i]))/this.tau
            }
        }
        let spk = new Array(this.size).fill(0)
        for(let i=0; i<this.size; i++){
            if(this.volts[i]>this.vt){
                this.volts[i] = 0
                spk[i] = 1
            }else{
                this.volts[i]+=(this.vrest-this.volts[i])/this.tau
            }
        }
        this.synapses.forEach((syn)=>syn.update(spk))
        return spk
    }
}

//init_weights
//tau = time const
//eqv = equilibrium potential
class Synapse{
    constructor(inp_size, out_size, tau, eqv, init_weights){
        this.inp_size = inp_size
        this.out_size = out_size
        if(init_weights){
            this.weights = init_weights
        }else{
            this.weights = new Array(inp_size).fill(0).map(()=>new Array(out_size).fill(1))
        }
        this.flows = new Array(out_size).fill(0)
        this.tau = tau
        this.eqv = eqv
    }

    accept_spk(input){
        if(input.length!=this.inp_size){
            console.error("Length error")
        }
        for(let i=0; i<this.inp_size; i++){
            if(input[i]==0) continue;
            for(let j=0; j<this.out_size; j++){
                this.flows[j]+=this.weights[i][j]
            }
        }
    }

    update(){
        for(let i=0; i<this.out_size; i++){
            this.flows[i]-=this.flows[i]/this.tau
        }
    }
}

class LearningSynapse extends Synapse{

    constructor(inp_size, out_size, tau, eqv, init_weights, ll_pre, ll_post, mu, x_tar, x_tau, w_max){
        super(inp_size, out_size, tau, eqv, init_weights)
        this.ll_pre = ll_pre
        this.ll_post = ll_post
        this.mu = mu
        this.x_tar = x_tar
        this.x_tau = x_tau
        this.x_pre = new Array(inp_size).fill(0)
        this.x_post = new Array(out_size).fill(0)
        this.w_max = w_max
    }

    accept_spk(input){
        super.accept_spk(input)
        for(let i=0; i<this.inp_size; i++){
            if(input[i]>0){
                this.x_pre[i]+=1
                for(let j=0; j<this.out_size; j++){
                    let dw = -this.ll_pre*this.x_post[j]*this.weights[i][j]
                    this.weights[i][j]=Math.max(0,this.weights[i][j]+dw)
                }
            }
            this.x_pre[i]-=this.x_pre[i]/this.x_tau
        }
    }

    update(spks){
        super.update()
        for(let i=0; i<this.out_size; i++){
            if(spks[i]>0){
                this.x_post[i]+=1
                for(let j=0; j<this.inp_size; j++){
                    let dw = this.ll_post*(this.x_pre[j]-this.x_tar)*(this.w_max-this.weights[j][i])
                    this.weights[j][i]=Math.max(0,this.weights[j][i]+dw)
                }
            }
            this.x_post[i]-=this.x_post[i]/this.x_tau
        }
    }
}

class InhibitOthers{
    constructor(size){
        this.size = size
        this.out_spk = new Array(size).fill(0)
    }

    accept_spk(input){
        if(input.length!=this.size){
            console.error("Length error")
        }
        let sum = input.reduce((psum, a) => psum + a, 0)
        this.out_spk = input.map((v)=>v<sum?1:0)
    }

    run_spk(){
        return this.out_spk
    }
}
