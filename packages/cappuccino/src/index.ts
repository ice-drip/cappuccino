import { Linter, Rule } from "eslint";

interface CappuccinoOptions {
  pluginName: string;
}

interface Plugin {
  rules: Record<string, Rule.RuleModule>;
  configs?: Record<string, Linter.Config>;
  processors?: Record<string, Linter.Processor>;
  environments?: Record<
    string,
    {
      globals: Record<string, boolean>;
      parserOptions: Linter.ParserOptions;
    }
  >;
}

interface RuleInfo {
  pluginName: string;
  plugin?: Plugin;
  ruleName: string;
  rule: Rule.RuleModule;
}

class Cappuccino {
  private pluginName: string;
  private plugins: Record<string,Plugin> = {};

  constructor(options: CappuccinoOptions) {
    this.pluginName = options.pluginName;
  }

  get rules(){
    return this.buildRules();
  }


  get configs(){
    return this.buildConfigs();
  }

  get processors(){
    return this.buildProcessors();
  }

  get environments(){
    return this.buildEnvironments()
  }

  addPlugins(plugins: Record<string,Plugin>) {
    Object.assign(this.plugins, plugins);
  }

  configRuleReference(info: RuleInfo) {
    return `${this.pluginName}/${info.pluginName}/${info.ruleName}`;
  }

  buildRules() {
    return ruleDict(this.plugins,opts=>[
        `${opts.pluginName}/${opts.ruleName}`,
        opts.rule
    ]);
  }

  buildConfigs(){
    const configs = {};
    Object.defineProperty(configs,"all",{
        configurable:true,
        enumerable:true,
        get:()=>{
            return {
                rules:ruleDict(this.plugins,opts=>[
                    this.configRuleReference(opts),
                    "error"
                ])
            }
        }
    })
    Object.defineProperty(configs,"all.warn",{
        configurable:true,
        enumerable:true,
        get:()=>{
            return {
                rules:ruleDict(this.plugins,opts=>[
                    this.configRuleReference(opts),
                    "warn"
                ])
            }
        }
    })
    Object.defineProperty(configs,"recommended",{
        configurable:true,
        enumerable:true,
        get:()=>{
            return {
                rules:Object.assign({},
                    ...Object.entries(this.plugins).map(([pluginName, plugin]) => {
                        const config = plugin.configs && plugin.configs.recommended
                        if (!config || !config.rules) {
                          return null
                        }
          
                        return Object.fromEntries(
                          Object.entries(config.rules).map(entry =>
                            this.prefixConfigRule(entry),
                          ),
                        )
                      }),)
            }
        }
    })

    Object.entries(this.plugins).forEach(([pluginName, plugin]) => {
        Object.entries(plugin.configs || {}).forEach(([configName, config]) => {
          Object.defineProperty(configs, `${pluginName}.all`, {
            configurable: true,
            enumerable: true,
            get: () => ({
              rules: ruleDict({[pluginName]: plugin}, opts => [
                this.configRuleReference(opts),
                'error',
              ]),
            }),
          })
          Object.defineProperty(configs, `${pluginName}.all.warn`, {
            configurable: true,
            enumerable: true,
            get: () => ({
              rules: ruleDict({[pluginName]: plugin}, opts => [
                this.configRuleReference(opts),
                'warn',
              ]),
            }),
          })
  
          Object.defineProperty(configs, `${pluginName}.${configName}`, {
            configurable: true,
            enumerable: true,
            get: () => {
              return {
                // don't do ...config, it's not really possible to support plugins' configs extending other configs
                // especially with the crazy eslint naming conventions.
                rules: Object.fromEntries(
                  Object.entries(config.rules as Linter.Config).map(entry =>
                    this.prefixConfigRule(entry),
                  ),
                ),
              }
            },
          })
        })
      })

      return configs

  }

  private prefixConfigRule([key, val]:[string,Linter.RuleEntry|undefined]) {
    const plugins = Object.keys(this.plugins)
    const matchingPlugin = plugins.find(name => key.startsWith(`${name}/`))
    return matchingPlugin ? [`${this.pluginName}/${key}`, val] : [key, val]
  }

  buildProcessors(){
    return Object.assign({},...Object.values(this.plugins).map(plugin => plugin.processors),)
  }

  buildEnvironments() {
    return Object.assign(
      {},
      ...Object.values(this.plugins).map(plugin => plugin.environments),
    )
  }

}

type GetEntry<T> = (opts: RuleInfo) => [string, T];

function ruleDict<T>(
  plugins: Record<string, Plugin>,
  getEntry: GetEntry<T>
): Record<string, T> {
  return Object.assign(
    {},
    ...Object.entries(plugins).map(([pluginName, plugin]) =>
      Object.fromEntries(
        Object.entries(plugin.rules || {}).map(([ruleName, rule]) =>
          getEntry({ pluginName, ruleName, rule })
        )
      )
    )
  );
}
export {Cappuccino}