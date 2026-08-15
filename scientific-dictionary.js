// =========================================================
// Scientific Dictionary
//
// Used by arxiv.js to replace difficult scientific/academic
// terminology with simpler language.
//
// Longer phrases are automatically processed before shorter
// terms by arxiv.js.
// =========================================================

const SCIENTIFIC_DICTIONARY = {

  // =======================================================
  // PHYSICS / WAVES
  // =======================================================

  "multipath environments":
    "systems with many different paths",

  "multipath environment":
    "system with many different paths",

  "multipath components":
    "different signal paths",

  "multipath component":
    "different signal path",

  "multipath difficulty":
    "difficulty caused by many paths",

  "multipath":
    "many different paths",

  "propagation paths":
    "paths that waves travel",

  "propagation path":
    "path that a wave travels",

  "propagation":
    "movement",

  "wave-based information processing":
    "information processing using waves",

  "wave management":
    "control of waves",

  "wave-management strategies":
    "ways of controlling waves",

  "wave-control landscape":
    "ways the waves can be controlled",

  "wave control":
    "control of waves",

  "scattering":
    "bouncing",

  "repeated scattering":
    "repeated bouncing",

  "interference":
    "waves affecting each other",

  "interfering propagation paths":
    "paths that affect each other",

  "perturbation":
    "small change",

  "perturbations":
    "small changes",

  "sensitivity to perturbations":
    "sensitivity to small changes",

  "extreme sensitivity":
    "very strong sensitivity",

  "nonlinear mechanism":
    "effect that makes the system harder to predict",

  "nonlinear mechanisms":
    "effects that make the system harder to predict",

  "nonlinear effect":
    "effect that makes the system harder to predict",

  "nonlinear effects":
    "effects that make the system harder to predict",

  "nonlinearity":
    "behavior where effects do not simply add together",

  "nonlinear":
    "not behaving in a simple proportional way",

  "superposition principle":
    "rule that waves can be added together",

  "superposition":
    "adding effects together",

  "diffraction":
    "spreading of a wave",

  "non-diffractive":
    "that does not spread much",

  "non-diffraction":
    "lack of wave spreading",

  "beam divergence":
    "how quickly a beam spreads",

  "divergence":
    "spreading",

  "orbital angular momentum":
    "a property describing the twisting of a wave",

  "OAM":
    "orbital angular momentum",

  "Bessel beam":
    "a beam that can stay narrow while traveling",

  "high-order Bessel beam":
    "a higher-order beam that stays narrow while traveling",

  "axicon phase":
    "phase pattern used to create a cone-shaped wave",

  "spatial phase":
    "phase that changes across space",

  "phase control":
    "control of the wave timing across space",

  "quasi-plane wave":
    "wave that is almost flat",

  "uniform amplitude":
    "equal signal strength",

  "amplitude excitation":
    "way of supplying signal strength",

  "sparse feed array":
    "array with fewer signal sources",

  "feed array":
    "array of signal sources",

  "metasurface":
    "thin surface designed to control waves",

  "transmitted metasurface":
    "thin surface that controls transmitted waves",

  "aperture efficiency":
    "how efficiently an opening uses its available area",

  "structural complexity":
    "difficulty of the physical design",

  "localized nonlinear defect":
    "small region with nonlinear behavior",

  "wave-chaotic platform":
    "wave system with very complicated paths",

  "adjoint propagation":
    "backward propagation used to calculate improvements",

  "forward propagation":
    "normal propagation from input to output",

  "gradient evaluation":
    "calculation of how to improve the result",

  "in-situ":
    "directly inside the system",

  "in-situ optimization":
    "optimization performed directly in the system",


  // =======================================================
  // MATHEMATICS
  // =======================================================

  "optimization theory":
    "the study of finding the best solution",

  "optimization":
    "finding the best solution",

  "optimize":
    "find the best solution",

  "optimized":
    "improved to get the best result",

  "optimal":
    "best",

  "optimization problem":
    "problem of finding the best solution",

  "control problem":
    "problem of deciding how to control a system",

  "parameter":
    "value",

  "parameters":
    "values",

  "variable":
    "changing value",

  "variables":
    "changing values",

  "derivative":
    "rate of change",

  "derivatives":
    "rates of change",

  "gradient":
    "information about which direction improves the result",

  "gradients":
    "information about which directions improve the result",

  "gradient descent":
    "method that repeatedly moves toward a better result",

  "first-order method":
    "method based on first derivatives",

  "first-order methods":
    "methods based on first derivatives",

  "contraction mapping":
    "mapping that brings values closer together",

  "contraction-mapping viewpoint":
    "approach based on repeatedly bringing values closer together",

  "fixed-point":
    "stable value that does not change",

  "fixed point":
    "stable value that does not change",

  "fixed-point tracking":
    "following a changing stable value",

  "tracking error":
    "difference between the target and what is being followed",

  "bias":
    "systematic difference from the desired result",

  "bias term":
    "term representing a systematic difference",

  "Euclidean norm":
    "standard measure of distance",

  "Fokker-Planck equation":
    "equation describing how a probability distribution changes",

  "Fokker-Planck":
    "equation describing how a probability distribution changes",

  "diffusion":
    "random spreading",

  "diffusion coefficient":
    "value describing how quickly random spreading occurs",

  "drift":
    "average direction of movement",

  "drift shift":
    "change in the average direction of movement",

  "drift-shift symmetry":
    "property where shifting the average movement does not change other features",

  "proportional wealth tax":
    "tax that takes the same fraction of wealth",

  "wealth distribution":
    "how wealth is spread among people",

  "Gini coefficient":
    "number measuring how unequal wealth is",

  "finite times":
    "limited time periods",

  "redistribution":
    "moving resources between people",

  "redistributive":
    "moving resources between people",

  "non-distortionary":
    "not changing people's economic choices",

  "migration":
    "moving to another place",

  "evasion":
    "avoiding a rule or payment",

  "portfolio distortion":
    "unwanted changes to investment choices",

  "intervention costs":
    "costs caused by taking action",

  "temporally weighted":
    "weighted according to time",

  "exponentially discounted":
    "giving less importance to older information",

  "finite-memory":
    "using only recent information",

  "windowed":
    "using a limited recent time window",

  "effective memory":
    "amount of past information that still matters",

  "constant step size":
    "fixed size of each update",

  "vanishing":
    "becoming smaller toward zero",

  "non-vanishing":
    "not approaching zero",

  "tracking floor":
    "minimum error that remains",

  "bias floor":
    "minimum systematic error that remains",


  // =======================================================
  // STATISTICS / DATA
  // =======================================================

  "statistical":
    "based on patterns in data",

  "statistically":
    "based on data and probability",

  "statistical distribution":
    "how values are spread",

  "joint distribution":
    "how several values vary together",

  "probability distribution":
    "how likely different values are",

  "correlation":
    "relationship between values",

  "correlations":
    "relationships between values",

  "data heterogeneity":
    "differences between data sources",

  "heterogeneity":
    "differences between things",

  "empirical":
    "based on real data",

  "quantitative":
    "based on numbers",

  "qualitative":
    "based on descriptions",

  "uncertainty":
    "lack of certainty",

  "variance":
    "measure of how spread out values are",

  "distribution":
    "how values are spread",

  "interpolate":
    "estimate values between known cases",

  "interpolates":
    "estimates values between known cases",

  "interpolation":
    "estimating values between known cases",

  "held-out conditions":
    "conditions not used during training",

  "held-out data":
    "data not used during training",

  "training data":
    "data used to teach a model",

  "real-world data":
    "data collected from real situations",


  // =======================================================
  // COMPUTER SCIENCE / AI
  // =======================================================

  "algorithm":
    "step-by-step method",

  "algorithms":
    "step-by-step methods",

  "computational":
    "done using a computer",

  "computation":
    "calculation done by a computer",

  "implementation":
    "way something is built",

  "implement":
    "build or use",

  "implemented":
    "built or used",

  "architecture":
    "design",

  "framework":
    "system",

  "frameworks":
    "systems",

  "generative neural network":
    "neural network that learns to create new examples",

  "generative neural networks":
    "neural networks that learn to create new examples",

  "generative model":
    "model that learns to create new examples",

  "generative models":
    "models that learn to create new examples",

  "neural network":
    "computer model inspired by the brain",

  "neural networks":
    "computer models inspired by the brain",

  "convolutional layers":
    "network layers that detect local patterns",

  "convolutional layer":
    "network layer that detects local patterns",

  "machine learning":
    "computer methods that learn from data",

  "learns":
    "finds patterns from data",

  "training":
    "teaching a model using data",

  "model":
    "mathematical representation of a system",

  "models":
    "mathematical representations of systems",

  "data-efficient":
    "using relatively little data",

  "system-level simulations":
    "simulations of the whole system",

  "simulation":
    "computer experiment",

  "simulations":
    "computer experiments",

  "database":
    "organized collection of data",

  "databases":
    "organized collections of data",

  "ray-tracing":
    "computer calculation of paths taken by rays",

  "ray tracing":
    "computer calculation of paths taken by rays",


  // =======================================================
  // WIRELESS / COMMUNICATIONS
  // =======================================================

  "wireless channel":
    "path between a transmitter and receiver",

  "wireless channels":
    "paths between transmitters and receivers",

  "channel modeling":
    "describing how a communication signal behaves",

  "channel model":
    "description of how a communication signal behaves",

  "geometry-deterministic":
    "determined directly from physical geometry",

  "geometry-based":
    "based on physical geometry",

  "geometry-based stochastic channel modeling":
    "probability-based modeling using physical geometry",

  "stochastic":
    "involving randomness",

  "stochastic channel modeling":
    "modeling a communication channel using randomness",

  "GBSM":
    "geometry-based stochastic channel model",

  "channel parameters":
    "values describing a communication channel",

  "channel images":
    "images representing channel data",

  "multipath components":
    "different signal paths",

  "system performance":
    "how well the system works",

  "wireless communications":
    "communication without physical cables",

  "system performance":
    "how well the system works",


  // =======================================================
  // SATELLITE / COMMUNICATION
  // =======================================================

  "low-Earth-orbit":
    "orbit close to Earth",

  "low-Earth-orbit satellite":
    "satellite in an orbit close to Earth",

  "downlink":
    "sending data from a satellite to the ground",

  "downlink imagery":
    "sending images from a satellite to the ground",

  "power budget":
    "limited amount of available power",

  "channel":
    "communication quality",

  "channel quality":
    "how good the communication connection is",

  "weather statistics":
    "data describing typical weather patterns",

  "safety margin":
    "extra allowance used to reduce risk",

  "scheduler":
    "system that decides when and how to perform tasks",

  "scheduling":
    "deciding when and how to perform tasks",

  "forecast":
    "prediction",

  "statistically reliable":
    "reliable according to probability and data",

  "genie":
    "ideal system with perfect information",

  "codec":
    "system that compresses and reconstructs data",

  "sharper cliff":
    "more sudden loss in performance",

  "backfire":
    "produce the opposite of the desired result",


  // =======================================================
  // RESEARCH TERMINOLOGY
  // =======================================================

  "methodology":
    "method",

  "methodologies":
    "methods",

  "novel":
    "new",

  "theoretical":
    "based on theory",

  "robust":
    "reliable",

  "feasible":
    "possible",

  "complexity":
    "difficulty",

  "applicability":
    "usefulness in practice",

  "practical value":
    "usefulness in practice",

  "general conditions":
    "many different conditions",

  "fundamentally":
    "in a basic way",

  "essentially":
    "basically",

  "respectively":
    "in the same order",

  "corresponding":
    "matching",

  "underlying":
    "basic",

  "significant":
    "important",

  "significantly":
    "clearly",

  "substantial":
    "large",

  "considerable":
    "large",

  "considerably":
    "a lot",

  "potential":
    "possible future benefit",

  "beneficial":
    "useful",


  // =======================================================
  // COMMON ACADEMIC VERBS
  // =======================================================

  "utilize":
    "use",

  "utilizes":
    "uses",

  "utilized":
    "used",

  "demonstrate":
    "show",

  "demonstrates":
    "shows",

  "demonstrated":
    "showed",

  "investigate":
    "study",

  "investigates":
    "studies",

  "investigated":
    "studied",

  "analyze":
    "study",

  "analyse":
    "study",

  "analyzes":
    "studies",

  "analyses":
    "studies",

  "evaluates":
    "tests",

  "evaluate":
    "test",

  "evaluated":
    "tested",

  "derive":
    "calculate",

  "derives":
    "calculates",

  "derived":
    "calculated",

  "obtain":
    "get",

  "obtains":
    "gets",

  "obtained":
    "got",

  "facilitate":
    "help",

  "facilitates":
    "helps",

  "facilitated":
    "helped",

  "mitigate":
    "reduce",

  "mitigates":
    "reduces",

  "mitigated":
    "reduced",

  "employ":
    "use",

  "employs":
    "uses",

  "employed":
    "used",

  "leverage":
    "use",

  "leverages":
    "uses",

  "exhibit":
    "show",

  "exhibits":
    "shows",

  "yield":
    "produce",

  "yields":
    "produces",

  "enhance":
    "improve",

  "enhances":
    "improves",

  "enhanced":
    "improved",

  "characterize":
    "describe",

  "characterizes":
    "describes",

  "characterized":
    "described",

  "formulate":
    "define",

  "formulates":
    "defines",

  "formulated":
    "defined",

  "incorporate":
    "include",

  "incorporates":
    "includes",

  "incorporated":
    "included",


  // =======================================================
  // ACADEMIC CONNECTORS
  // =======================================================

  "furthermore":
    "also",

  "moreover":
    "also",

  "therefore":
    "so",

  "consequently":
    "so",

  "nevertheless":
    "however",

  "thus":
    "so",

  "hence":
    "so",

  "subsequently":
    "later",

  "approximately":
    "about",

  "additionally":
    "also",

  "alternatively":
    "instead",

  "specifically":
    "in particular",

  "notably":
    "especially",

  "whereas":
    "while",

  "thereby":
    "by doing this",


  // =======================================================
  // ACADEMIC PHRASES
  // =======================================================

  "in order to":
    "to",

  "with respect to":
    "about",

  "in the context of":
    "in",

  "in terms of":
    "for",

  "prior to":
    "before",

  "a large number of":
    "many",

  "a small number of":
    "few",

  "with the aim of":
    "to",

  "for the purpose of":
    "to",

  "in accordance with":
    "following",

  "on the basis of":
    "based on",

  "as a result of":
    "because of",

  "due to the fact that":
    "because",

  "in the case of":
    "for",

  "in addition to":
    "besides",

  "at the same time":
    "also",

  "for this reason":
    "so",

  "under these conditions":
    "in this situation",

  "in a manner similar to":
    "like",

  "a wide range of":
    "many types of",

  "a significant number of":
    "many",

  "a considerable amount of":
    "a lot of",

  "a considerable number of":
    "many",


  // =======================================================
  // COMMON SCIENTIFIC PHRASES
  // =======================================================

  "plays a crucial role":
    "is very important",

  "plays an important role":
    "is important",

  "plays a significant role":
    "is important",

  "has the potential to":
    "could",

  "has the ability to":
    "can",

  "is capable of":
    "can",

  "is required to":
    "must",

  "is necessary to":
    "is needed to",

  "is used to":
    "helps to",

  "is widely used":
    "is commonly used",

  "can be used to":
    "can help",

  "is based on":
    "uses",

  "is composed of":
    "is made of",

  "consists of":
    "is made of",

  "involves the use of":
    "uses",

  "results in":
    "causes",

  "leads to":
    "causes",

  "gives rise to":
    "causes",

  "is associated with":
    "is linked to",

  "is related to":
    "is linked to",

  "is characterized by":
    "has",

  "is defined as":
    "means",

  "can be interpreted as":
    "can be understood as",

  "it should be noted that":
    "note that",

  "it is important to note that":
    "importantly",

  "it is worth noting that":
    "notably",

  "the results indicate that":
    "the results show that",

  "the results demonstrate that":
    "the results show that",

  "our results indicate that":
    "our results show that",

  "our results demonstrate that":
    "our results show that",

  "the findings suggest that":
    "the results suggest that",

  "the findings demonstrate that":
    "the results show that",

  "can be attributed to":
    "is caused by",

  "is consistent with":
    "agrees with",

  "in agreement with":
    "matching",

  "underlying mechanism":
    "basic cause",

  "underlying mechanisms":
    "basic causes",

  "fundamentally alters":
    "changes",

  "fundamentally change":
    "change",

  "fundamentally changes":
    "changes",

  "obscuring":
    "making it harder to see",

  "generating extreme sensitivity":
    "making the system very sensitive",

  "extreme sensitivity to":
    "strong sensitivity to",

  "can be harnessed":
    "can be used",

  "can be harnessed as":
    "can be used as",

  "key resources":
    "useful tools",

  "in-situ":
    "directly inside the system",

  "incorporating":
    "with",

  "consisting of":
    "made of",

  "composed of":
    "made of",

  "increasingly important":
    "more important",

  "highly effective":
    "very effective",

  "highly accurate":
    "very accurate",

  "state-of-the-art":
    "very advanced",

  "novel approach":
    "new method",

  "novel method":
    "new method",

  "novel framework":
    "new system",

  "prior work":
    "earlier research",

  "existing approaches":
    "current methods",

  "existing methods":
    "current methods"
};
