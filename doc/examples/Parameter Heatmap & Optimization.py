# -*- coding: utf-8 -*-
# ---
# jupyter:
#   jupytext:
#     text_representation:
#       extension: .py
#       format_name: percent
#       format_version: '1.3'
#       jupytext_version: 1.17.1
#   kernelspec:
#     display_name: Python 3 (ipykernel)
#     language: python
#     name: python3
# ---

# %% [markdown]
# Parameter Heatmap
# ==========
#
# This tutorial will show how to optimize strategies with multiple parameters and how to examine and reason about optimization results.
# It is assumed you're already familiar with
# [basic _backtesting.py_ usage](https://kernc.github.io/backtesting.py/doc/examples/Quick%20Start%20User%20Guide.html).
#
# First, let's again import our helper moving average function.
# In practice, one should use functions from an indicator library, such as
# [TA-Lib](https://github.com/mrjbq7/ta-lib) or
# [Tulipy](https://tulipindicators.org).

# %%
from backtesting.test import SMA

# %% [markdown]
# Our strategy will be a similar moving average cross-over strategy to the one in
# [Quick Start User Guide](https://kernc.github.io/backtesting.py/doc/examples/Quick%20Start%20User%20Guide.html),
# but we will use four moving averages in total:
# two moving averages whose relationship determines a general trend
# (we only trade long when the shorter MA is above the longer one, and vice versa),
# and two moving averages whose cross-over with daily _close_ prices determine the signal to enter or exit the position.

# %%
from backtesting import Strategy
from backtesting.lib import crossover


class Sma4Cross(Strategy):
    n1 = 50
    n2 = 100
    n_enter = 20
    n_exit = 10
    
    def init(self):
        self.sma1 = self.I(SMA, self.data.Close, self.n1)
        self.sma2 = self.I(SMA, self.data.Close, self.n2)
        self.sma_enter = self.I(SMA, self.data.Close, self.n_enter)
        self.sma_exit = self.I(SMA, self.data.Close, self.n_exit)
        
    def next(self):
        
        if not self.position:
            
            # On upwards trend, if price closes above
            # "entry" MA, go long
            
            # Here, even though the operands are arrays, this
            # works by implicitly comparing the two last values
            if self.sma1 > self.sma2:
                if crossover(self.data.Close, self.sma_enter):
                    self.buy()
                    
            # On downwards trend, if price closes below
            # "entry" MA, go short
            
            else:
                if crossover(self.sma_enter, self.data.Close):
                    self.sell()
        
        # But if we already hold a position and the price
        # closes back below (above) "exit" MA, close the position
        
        else:
            if (self.position.is_long and
                crossover(self.sma_exit, self.data.Close)
                or
                self.position.is_short and
                crossover(self.data.Close, self.sma_exit)):
                
                self.position.close()


# %% [markdown]
# It's not a robust strategy, but we can optimize it.
#
# [Grid search](https://en.wikipedia.org/wiki/Hyperparameter_optimization#Grid_search)
# is an exhaustive search through a set of specified sets of values of hyperparameters. One evaluates the performance for each set of parameters and finally selects the combination that performs best.
#
# Let's optimize our strategy on Google stock data using _randomized_ grid search over the parameter space, evaluating at most (approximately) 200 randomly chosen combinations:

# %%
# %%time 

from backtesting import Backtest
from backtesting.test import GOOG


backtest = Backtest(GOOG, Sma4Cross, commission=.002)

stats, heatmap = backtest.optimize(
    n1=range(10, 110, 10),
    n2=range(20, 210, 20),
    n_enter=range(15, 35, 5),
    n_exit=range(10, 25, 5),
    constraint=lambda p: p.n_exit < p.n_enter < p.n1 < p.n2,
    maximize='Equity Final [$]',
    max_tries=200,
    random_state=0,
    return_heatmap=True)

# %% [markdown]
# Notice `return_heatmap=True` parameter passed to
# [`Backtest.optimize()`](https://kernc.github.io/backtesting.py/doc/backtesting/backtesting.html#backtesting.backtesting.Backtest.optimize).
# It makes the function return a heatmap series along with the usual stats of the best run.
# `heatmap` is a pandas Series indexed with a MultiIndex, a cartesian product of all permissible (tried) parameter values.
# The series values are from the `maximize=` argument we provided.

# %%
heatmap

# %% [markdown]
# This heatmap contains the results of all the runs,
# making it very easy to obtain parameter combinations for e.g. three best runs:

# %%
heatmap.sort_values().iloc[-3:]

# %% [markdown]
# But we use vision to make judgements on larger data sets much faster.
# Let's plot the whole heatmap by projecting it on two chosen dimensions.
# Say we're mostly interested in how parameters `n1` and `n2`, on average, affect the outcome.

# %%
hm = heatmap.groupby(['n1', 'n2']).mean().unstack()
hm = hm[::-1]
hm

# %% [markdown]
# Let's plot this table as a heatmap:

# %%
# %matplotlib inline

import matplotlib.pyplot as plt

fig, ax = plt.subplots()
im = ax.imshow(hm, cmap='viridis')
_ = (
    ax.set_xticks(range(len(hm.columns)), labels=hm.columns),
    ax.set_yticks(range(len(hm)), labels=hm.index),
    ax.set_xlabel('n2'),
    ax.set_ylabel('n1'),
    ax.figure.colorbar(im, ax=ax),
)

# %% [markdown]
# We see that, on average, we obtain the highest result using trend-determining parameters `n1=30` and `n2=100` or `n1=70` and `n2=80`,
# and it's not like other nearby combinations work similarly well — for our particular strategy, these combinations really stand out.
#
# Since our strategy contains several parameters, we might be interested in other relationships between their values.
# We can use
# [`backtesting.lib.plot_heatmaps()`](https://kernc.github.io/backtesting.py/doc/backtesting/lib.html#backtesting.lib.plot_heatmaps)
# function to plot interactive heatmaps of all parameter combinations simultaneously.
#
# <a id=plot-heatmaps></a>

# %%
from backtesting.lib import plot_heatmaps


plot_heatmaps(heatmap, agg='mean')

# %% [markdown]
# ## Model-based optimization
#
# Above, we used _randomized grid search_ optimization method. Any kind of grid search, however, might be computationally expensive for large data sets. In the follwing example, we will use
# [_SAMBO Optimization_](https://sambo-optimization.github.io)
# package to guide our optimization better informed using forests of decision trees.
# The hyperparameter model is sequentially improved by evaluating the expensive function (the backtest) at the next best point, thereby hopefully converging to a set of optimal parameters with **as few evaluations as possible**.
#
# So, with `method="sambo"`:

# %%
# %%capture

# ! pip install sambo  # This is a run-time dependency

# %%
# #%%time

stats, heatmap, optimize_result = backtest.optimize(
    n1=[10, 100],      # Note: For method="sambo", we
    n2=[20, 200],      # only need interval end-points
    n_enter=[10, 40],
    n_exit=[10, 30],
    constraint=lambda p: p.n_exit < p.n_enter < p.n1 < p.n2,
    maximize='Equity Final [$]',
    method='sambo',
    max_tries=40,
    random_state=0,
    return_heatmap=True,
    return_optimization=True)

# %%
heatmap.sort_values().iloc[-3:]

# %% [markdown]
# Notice how the optimization runs somewhat slower even though `max_tries=` is lower. This is due to the sequential nature of the algorithm and should actually perform quite comparably even in cases of _much larger parameter spaces_ where grid search would effectively blow up, likely reaching a better optimum than a simple randomized search would.
# A note of warning, again, to take steps to avoid
# [overfitting](https://en.wikipedia.org/wiki/Overfitting)
# insofar as possible.
#
# Understanding the impact of each parameter on the computed objective function is easy in two dimensions, but as the number of dimensions grows, partial dependency plots are increasingly useful.
# [Plotting tools from _SAMBO_](https://sambo-optimization.github.io/doc/sambo/plot.html)
# take care of the more mundane things needed to make good and informative plots of the parameter space.
#
# Note, because SAMBO internally only does _minimization_, the values in `optimize_result` are negated (less is better).

# %%
from sambo.plot import plot_objective

names = ['n1', 'n2', 'n_enter', 'n_exit']
_ = plot_objective(optimize_result, names=names, estimator='et')

# %%
from sambo.plot import plot_evaluations

_ = plot_evaluations(optimize_result, names=names)

# %% [markdown]
# Learn more by exploring further
# [examples](https://kernc.github.io/backtesting.py/doc/backtesting/index.html#tutorials)
# or find more framework options in the
# [full API reference](https://kernc.github.io/backtesting.py/doc/backtesting/index.html#header-submodules).
